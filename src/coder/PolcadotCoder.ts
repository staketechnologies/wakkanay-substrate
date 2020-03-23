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
import { Constructor, Codec } from '@polkadot/types/types'

/**
 * mapping between @cryptoeconomicslab/primitives and polcadot-js
 * Address -> AccountId
 * Bytes -> Vec<u8>
 * Integer -> U256
 * BigNumber -> U256
 * List<T> -> Vec<T>
 * Tuple<T[]> -> Tuple<T[]>
 * Struct<{[key: string]: T}> -> Tuple<T[]>
 */
type TypeString = 'AccountId' | 'u128' | 'Vec<u8>'

export function getVecType<T extends Codable>(l: List<T>): any {
  return getTypeString(l.getC().default())
}

export function getTupleType(t: Tuple | Struct) {
  if (t instanceof Tuple) {
    return t.data.map(r => getTypeString(r))
  } else if (t instanceof Struct) {
    return t.data.map(r => getTypeString(r.value))
  } else {
    throw new Error('Invalid type to get tuple type')
  }
}

export function getTypeString(
  v: Codable
): TypeString | Constructor<types.Tuple> | Constructor<types.Vec<Codec>> {
  if (v instanceof Address) {
    return 'AccountId'
  } else if (v instanceof Bytes) {
    return types.Vec.with('u8')
  } else if (v instanceof Integer || v instanceof BigNumber) {
    return 'u128'
  } else if (v instanceof List) {
    return types.Vec.with(getVecType(v))
  } else if (v instanceof Tuple) {
    return types.Tuple.with(getTupleType(v))
  } else if (v instanceof Struct) {
    return types.Tuple.with(getTupleType(v))
  }
  throw new Error(
    `Invalid type to get type string for Polcadot Abi coder: ${v.toString()}`
  )
}

interface A {
  toU8a(): Uint8Array
}

function innerEncode(registry: TypeRegistry, input: Codable): A {
  if (input instanceof Address) {
    throw new Error(`Address doesn't support yet`)
  } else if (input instanceof Bytes) {
    return new types.Vec(
      registry,
      'u8',
      Array.from(input.data).map(d => d.toString())
    )
  } else if (input instanceof Integer) {
    return new types.u128(registry, input.raw)
  } else if (input instanceof BigNumber) {
    return new types.u128(registry, input.raw)
  } else if (input instanceof List) {
    return new types.Vec(
      registry,
      getVecType(input),
      input.data.map(d => innerEncode(registry, d))
    )
  } else if (input instanceof Tuple) {
    return new types.Tuple(
      registry,
      getTupleType(input),
      input.data.map(d => innerEncode(registry, d))
    )
  } else if (input instanceof Struct) {
    return new types.Tuple(
      registry,
      getTupleType(input),
      input.data.map(d => innerEncode(registry, d.value))
    )
  }
  throw new Error(
    `Invalid type to encode for Polcadot Abi coder: ${input.toString()}`
  )
}

function decodeInner(
  registry: TypeRegistry,
  definition: Codable,
  data: any
): Codable {
  if (definition instanceof Address) {
    throw new Error(`Address doesn't support yet`)
  } else if (definition instanceof Bytes) {
    const arr = data as types.Vec<types.u8>
    return Bytes.from(
      Uint8Array.from(
        arr.map(c => {
          return c.toU8a()[0]
        })
      )
    )
  } else if (definition instanceof Integer) {
    return Integer.from(Number(data))
  } else if (definition instanceof BigNumber) {
    return BigNumber.fromString(data)
  } else if (definition instanceof List) {
    const arr = data as any[]
    return List.from(
      definition.getC().default(),
      arr.map(c => decodeInner(registry, definition.getC().default(), c))
    )
  } else if (definition instanceof Tuple) {
    const tuple = data as types.Tuple
    return Tuple.from(
      tuple.map((c, index) => {
        return decodeInner(registry, definition.data[index], c)
      })
    )
  } else if (definition instanceof Struct) {
    const tuple = data as types.Tuple
    return Struct.from(
      tuple.map((c, index) => {
        return {
          key: definition.data[index].key,
          value: decodeInner(registry, definition.data[index].value, c)
        }
      })
    )
  } else {
    throw new Error('method not implemented')
  }
}

function innerDecode(registry: TypeRegistry, definition: Codable, data: Bytes) {
  if (definition instanceof Address) {
    throw new Error(`Address doesn't support yet`)
  } else if (definition instanceof Bytes) {
    return types.Vec.decodeVec(registry, types.u8, data.data)
  } else if (definition instanceof Integer || definition instanceof BigNumber) {
    return types.u128.decodeAbstracInt(data.data, 256, false)
  } else if (definition instanceof List) {
    return types.Vec.decodeVec(registry, getVecType(definition), data.data)
  } else if (definition instanceof Tuple) {
    return new types.Tuple(registry, getTupleType(definition), data.data)
  } else if (definition instanceof Struct) {
    return new types.Tuple(registry, getTupleType(definition), data.data)
  } else {
    throw new Error('method not implemented')
  }
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
    const registry = new TypeRegistry()
    return decodeInner(registry, d, innerDecode(registry, d, data)) as T
  }
}

export default PolcadotCoder
