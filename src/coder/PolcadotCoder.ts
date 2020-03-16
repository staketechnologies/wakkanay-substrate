import { Coder } from '@cryptoeconomicslab/coder'
import {
  Codable,
  Address,
  Bytes,
  List,
  Tuple,
  Struct,
  Integer,
  BigNumber
} from '@cryptoeconomicslab/primitives'
import * as types from '@polkadot/types'
import TypeRegistry = types.TypeRegistry
import { Compact } from '@polkadot/types/codec'

/**
 * mapping between @cryptoeconomicslab/primitives and polcadot-js
 * Address -> Address
 * Bytes -> Raw
 * Integer -> U256
 * BigNumber -> U256
 * List<T> -> Vec<T>
 * Tuple<T[]> -> Tuple<T[]>
 * Struct<{[key: string]: T}> -> Tuple<T[]>
 */
type TypeString = 'Address' | 'U256' | 'Raw'

/**
 * https://substrate.dev/docs/en/conceptual/core/codec#tuples-and-structures
 */
class PolcadotTuple {
  constructor(readonly items: Codable[]) {}
  toU8a(): Uint8Array {
    return Bytes.concat(this.items.map(i => PolcadotCoder.encode(i))).data
  }
}

/**
 * https://substrate.dev/docs/en/conceptual/core/codec#vectors-lists-series-sets
 */
class PolcadotVec {
  constructor(readonly items: Codable[]) {}
  toU8a(): Uint8Array {
    const bytesItems = [
      Bytes.from(Compact.encodeU8a(this.items.length))
    ].concat(this.items.map(i => PolcadotCoder.encode(i)))
    return Bytes.concat(bytesItems).data
  }
}

export function getTupleType(t: Tuple | Struct): TypeString[] {
  if (t instanceof Tuple) {
    return t.data.map((r, index) => getTypeString(r))
  } else if (t instanceof Struct) {
    return t.data.map((r, index) => getTypeString(r.value))
  } else {
    throw new Error('Invalid type to get tuple type')
  }
}

export function getTypeString(v: Codable): TypeString {
  if (v instanceof Address) {
    return 'Address'
  } else if (v instanceof Bytes) {
    return 'Raw'
  } else if (v instanceof Integer || v instanceof BigNumber) {
    return 'U256'
  } else if (v instanceof List) {
    throw new Error("getTypeString doesn't support List")
  } else if (v instanceof Tuple) {
    throw new Error("getTypeString doesn't support Tuple")
  } else if (v instanceof Struct) {
    throw new Error("getTypeString doesn't support Struct")
  }
  throw new Error(
    `Invalid type to get type string for Polcadot Abi coder: ${v.toString()}`
  )
}

function innerEncode(registry: TypeRegistry, input: Codable) {
  const c = input.constructor.name
  if (input instanceof Bytes) {
    return new types.Vec(
      registry,
      'u8',
      Array.from(input.data).map(d => d.toString())
    )
  } else if (input instanceof Integer) {
    return new types.U256(registry, input.raw)
  } else if (input instanceof BigNumber) {
    return new types.U256(registry, input.raw)
  } else if (input instanceof List) {
    return new PolcadotVec(input.data)
  } else if (input instanceof Tuple) {
    return new PolcadotTuple(input.data)
  } else if (input instanceof Struct) {
    return new PolcadotTuple(input.data.map(d => d.value))
  }
  throw new Error(
    `Invalid type to encode for Polcadot Abi coder: ${input.toString()}`
  )
}

// Polcadot coder object
export const PolcadotCoder: Coder = {
  /**
   * encode given codable object into EthereumABI hex string representation
   * @param input codable object to encode
   */
  encode(input: Codable): Bytes {
    const registry = new TypeRegistry()
    return Bytes.from(innerEncode(registry, input).toU8a())
  },
  /**
   * decode given hex string into given codable object
   * @param d Codable object to represent into what type data is decoded
   * @param data hex string to decode
   */
  decode<T extends Codable>(d: T, data: Bytes): T {
    throw new Error('method not implemented')
  }
}

export default PolcadotCoder
