import PolcadotCoder from '../../src/coder/PolcadotCoder'
import { BigNumber, Bytes, List, Tuple } from '@cryptoeconomicslab/primitives'
import * as types from '@polkadot/types'
import TypeRegistry = types.TypeRegistry
import { Compact } from '@polkadot/types/codec'

function getTestData(num: BigNumber, bytes: Bytes) {
  const registry = new TypeRegistry()
  const u256 = new types.U256(registry, num.data.toString())
  const vecu8 = new types.Vec(
    registry,
    'u8',
    Array.from(bytes.data).map(d => d.toString())
  )
  const tuple = new types.Tuple(
    registry,
    [types.U256, 'Vec<u8>'],
    [u256, vecu8]
  )
  return Bytes.from(tuple.toU8a())
}

describe('PolcadotCoder', () => {
  test('encode BigNumber', () => {
    const encoded = PolcadotCoder.encode(BigNumber.from(100))
    expect(encoded.toHexString()).toBe(
      '0x6400000000000000000000000000000000000000000000000000000000000000'
    )
  })

  test('encode Bytes', () => {
    const encoded = PolcadotCoder.encode(Bytes.fromHexString('0x0012345678'))
    expect(encoded.toHexString()).toBe('0x140012345678')
  })

  test('encode List of Bytes', () => {
    const encoded = PolcadotCoder.encode(
      List.from(Bytes, [Bytes.fromHexString('0x0012345678')])
    )
    expect(encoded.toHexString()).toBe('0x04140012345678')
  })

  test('encode Tuple', () => {
    const encoded = PolcadotCoder.encode(
      Tuple.from([BigNumber.from(100), Bytes.fromHexString('0x0012345678')])
    )
    expect(encoded.toHexString()).toBe(
      getTestData(
        BigNumber.from(100),
        Bytes.fromHexString('0x0012345678')
      ).toHexString()
    )
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
      '0x08640000000000000000000000000000000000000000000000000000000000000018001234567801c80000000000000000000000000000000000000000000000000000000000000018001234567802'
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
      '0x64000000000000000000000000000000000000000000000000000000000000001400123456780c0000010c000002'
    )
  })
})
