const fs = require('fs-extra')
const { LocalFile, BlobFile } = require('generic-filehandle')
const { BgzfFilehandle } = require('../src')

async function testRead(basename, length, position) {
  const f = new BgzfFilehandle({
    path: require.resolve(`./data/${basename}.gz`),
    gziPath: require.resolve(`./data/${basename}.gz.gzi`),
  })

  const buf1 = Buffer.allocUnsafe(length)
  const buf2 = Buffer.allocUnsafe(length)
  const { bytesRead } = await f.read(buf1, 0, length, position)
  const fd = await fs.open(require.resolve(`./data/${basename}`), 'r')
  const { bytesRead: directBytesRead } = await fs.read(
    fd,
    buf2,
    0,
    length,
    position,
  )
  expect(bytesRead).toEqual(directBytesRead)
  expect(Array.from(buf1.slice(0, bytesRead))).toEqual(
    Array.from(buf2.slice(0, bytesRead)),
  )

  const directStat = await fs.fstat(fd)
  const myStat = await f.stat()
  expect(myStat.size).toEqual(directStat.size)
}

describe('indexed BGZF file', () => {
  it('can read gff3_with_syncs.gff3.gz', async () => {
    await testRead('gff3_with_syncs.gff3', 10, 0)
    await testRead('gff3_with_syncs.gff3', 10, 100)
    await testRead('gff3_with_syncs.gff3', 1000, 100)
    await testRead('gff3_with_syncs.gff3', 2500, 0)
    await testRead('gff3_with_syncs.gff3', 3000, 1)
  })
  it('can read T_ko.2bit', async () => {
    await testRead('T_ko.2bit', 10, 0)
    await testRead('T_ko.2bit', 10000, 20000)
    await testRead('T_ko.2bit', 10000, 1)
    await testRead('T_ko.2bit', 10, 0)
    await testRead('T_ko.2bit', 10, 1000000)
  })
})

test('test vcf file with path', async () => {
  const f = new BgzfFilehandle({
    gziPath: require.resolve('./data/test.vcf.gz.gzi'),
    path: require.resolve('./data/test.vcf.gz'),
  })
  const { size } = await f.stat()
  expect(size).toEqual(1749)
})

test('test vcf file with filehandle/LocalFile', async () => {
  const f = new BgzfFilehandle({
    gziFilehandle: new LocalFile(require.resolve('./data/test.vcf.gz.gzi')),
    filehandle: new LocalFile(require.resolve('./data/test.vcf.gz')),
  })
  const { size } = await f.stat()
  expect(size).toEqual(1749)
  const stats = await f.stat()
})

test('test vcf file with filehandle/BlobFile', async () => {
  const f = new BgzfFilehandle({
    gziFilehandle: new BlobFile(
      new Blob([fs.readFileSync(require.resolve('./data/test.vcf.gz.gzi'))], {
        type: 'text/plain',
      }),
    ),
    filehandle: new BlobFile(
      new Blob([fs.readFileSync(require.resolve('./data/test.vcf.gz'))], {
        type: 'text/plain',
      }),
    ),
  })
  const { size } = await f.stat()
  expect(size).toEqual(1749)
})
