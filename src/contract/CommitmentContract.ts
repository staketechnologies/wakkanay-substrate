import { contract, db, types } from 'wakkanay'
import { ApiPromise } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import Address = types.Address
import BigNumber = types.BigNumber
import Bytes = types.Bytes
import ICommitmentContract = contract.ICommitmentContract
import KeyValueStore = db.KeyValueStore

export class CommitmentContract implements ICommitmentContract {
  constructor(
    readonly address: Address,
    eventDb: KeyValueStore,
    readonly api: ApiPromise,
    readonly keyPair: KeyringPair
  ) {}

  async submit(blockNumber: BigNumber, root: Bytes) {
    await this.api.tx.commitment
      .submitRoot(blockNumber.raw, root.toHexString())
      .signAndSend(this.keyPair)
  }

  async getCurrentBlock(): Promise<BigNumber> {
    // confirm that this.address.data is hex string
    const blockNumber = await this.api.query.commitment.getCurrentBlock()
    return BigNumber.fromHexString(blockNumber.toHex())
  }

  async getRoot(blockNumber: BigNumber): Promise<Bytes> {
    const root = await this.api.query.commitment.getRoot(
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
