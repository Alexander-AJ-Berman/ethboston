const web3 = require('./web3')
const MAX_INT = web3.utils.toWei('10000', 'ether')

const {
    CusdContract,
    AceContract
} = require('./contracts')

const get_allowance = async (address) => {
    let allowance = await CusdContract.methods.allowance(address, AceContract.options.address).call()
    return parseFloat(web3.utils.fromWei(allowance, 'ether'))
}
const get_balance = async (address) => {
    let balance = await CusdContract.methods.balanceOf(address).call()
    return parseFloat(web3.utils.fromWei(balance, 'ether'))
}
const get_increase_allowance_transaction = () => {
    let approveTransaction = CusdContract.methods.increaseApproval(
        AceContract.options.address, 
        MAX_INT
    )
    return approveTransaction
}

module.exports = {
    get_allowance
}

const seed_account = require('./seed_account')
const seed_account_erc20 = require('./seed_account_erc20')
const zk_bridge = require('./zk_bridge')

// Test
const test = async () => {
    const cryptomodule = require('../crypto')
    let hd_wallet = cryptomodule.generate_hd_wallet()
    let hd_node = hd_wallet.hd_wallet
    let eth_wallet = cryptomodule.eth_get_account_at_index(hd_node, 0, 0)
    let signer = eth_wallet.account
    console.log(`Using eth account: ${signer}`)
    let allowance = await get_allowance(signer)
    console.log(`Current ACE allowance to spend:`, allowance)

    let unsigned_increase_approval_txn = get_increase_allowance_transaction()
    let txn = {
        to: CusdContract.options.address,
        data: unsigned_increase_approval_txn.encodeABI()
    }
    let signed_increase_approval_txn = await eth_wallet.sign_transaction(
        txn,
        eth_wallet.private_key
    )

    // First, seed sending account
    let pending_seed = await seed_account(signer)
    console.log(`Seeded account:`, pending_seed)

    // Increase allowance for ACE
    let pending_hash = await web3.eth.sendSignedTransaction(
        signed_increase_approval_txn.rawTransaction
    )
    console.log(pending_hash)

    let post_allowance = await get_allowance(signer)
    console.log(`New ACE allowance to spend:`, post_allowance)

    // Mint CUSD to convert into ZK form
    let balance = await get_balance(signer)
    console.log(`Current ERC20 balance:`, balance)
    let pending_seed_erc20 = await seed_account_erc20(signer)
    console.log(`Seeded account with ERC20:`, pending_seed_erc20)
    let post_balance = await get_balance(signer)
    console.log(`New ERC20 balance:`, post_balance)

    const amount_to_deposit = 10
    let convert_zk_notes = await zk_bridge.erc20_to_zk_notes(amount_to_deposit, eth_wallet)
    console.log(convert_zk_notes)
}
test()