import { contract, db, types } from 'wakkanay'
import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import AccountId from '@polkadot/types/primitive/Generic/AccountId'
import { TypeRegistry, U256, H256 } from '@polkadot/types'
import Address = types.Address
import BigNumber = types.BigNumber
import Bytes = types.Bytes
import ICommitmentContract = contract.ICommitmentContract
import KeyValueStore = db.KeyValueStore

export class CommitmentContract implements ICommitmentContract {
  registry: TypeRegistry
  contractId: AccountId
  constructor(
    readonly address: Address,
    eventDb: KeyValueStore,
    readonly api: ApiPromise,
    readonly operatorKeyPair: KeyringPair
  ) {
    this.registry = new TypeRegistry()
    // confirm that this.address.data is hex string
    this.contractId = new AccountId(this.registry, this.address.data)
  }

  async submit(blockNumber: BigNumber, root: Bytes) {
    await this.api.tx.commitment
      .submitRoot(
        this.contractId,
        blockNumber.raw,
        root.toHexString()
        // new U256(this.registry, blockNumber.raw),
        // new H256(this.registry, root.toHexString())
      )
      .signAndSend(this.operatorKeyPair, {})
  }

  async getCurrentBlock(): Promise<BigNumber> {
    const blockNumber = await this.api.query.commitment.getCurrentBlock(
      this.contractId
    )
    return BigNumber.fromHexString(blockNumber.toHex())
  }

  async getRoot(blockNumber: BigNumber): Promise<Bytes> {
    const root = await this.api.query.commitment.getRoot(
      this.contractId,
      Bytes.fromHexString(blockNumber.toHexString()).data
    )
    return Bytes.fromHexString(root.toHex())
  }

  subscribeBlockSubmitted(
    handler: (blockNumber: BigNumber, root: Bytes) => void
  ) {
    throw new Error('Method not implemented.')
  }
}
