import PolcadotCoder from '../../src/coder/PolcadotCoder'
import { BigNumber, Bytes, List, Tuple } from '@cryptoeconomicslab/primitives'

describe('PolcadotCoder', () => {
  test('encode BigNumber', () => {
    const encoded = PolcadotCoder.encode(BigNumber.from(100))
    expect(encoded.toHexString()).toBe('0x6400000000000000')
  })

  test('encode Bytes', () => {
    const encoded = PolcadotCoder.encode(Bytes.fromHexString('0x0012345678'))
    expect(encoded.toHexString()).toBe('0x0012345678')
  })

  test('encode List of Bytes', () => {
    const encoded = PolcadotCoder.encode(
      List.from(Bytes, [Bytes.fromHexString('0x0012345678')])
    )
    expect(encoded.toHexString()).toBe('0x040012345678')
  })

  test('encode Tuple', () => {
    const encoded = PolcadotCoder.encode(
      Tuple.from([BigNumber.from(100), Bytes.fromHexString('0x0012345678')])
    )
    expect(encoded.toHexString()).toBe('0x64000000000000000012345678')
  })

  test('encode List of Tuple', () => {
    const factory = {
      default: () => Tuple.from([BigNumber.default(), Bytes.default()])
    }
    const encoded = PolcadotCoder.encode(
      List.from(factory, [
        Tuple.from([
          BigNumber.from(100),
          Bytes.fromHexString('0x001234567801')
        ]),
        Tuple.from([BigNumber.from(200), Bytes.fromHexString('0x001234567802')])
      ])
    )
    expect(encoded.toHexString()).toBe(
      '0x086400000000000000001234567801c800000000000000001234567802'
    )
  })

  test('encode Tuple of Tuple', () => {
    const encoded = PolcadotCoder.encode(
      Tuple.from([
        Tuple.from([BigNumber.from(100), Bytes.fromHexString('0x0012345678')]),
        Tuple.from([
          Bytes.fromHexString('0x000001'),
          Bytes.fromHexString('0x000002')
        ])
      ])
    )
    expect(encoded.toHexString()).toBe(
      '0x64000000000000000012345678000001000002'
    )
  })
})
