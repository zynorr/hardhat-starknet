#[starknet::interface]
trait IHelloStarknet<TContractState> {
    fn get_balance(self: @TContractState) -> u256;
    fn increase_balance(ref self: TContractState, amount: u256);
    fn get_greeting(self: @TContractState) -> felt252;
    fn set_greeting(ref self: TContractState, greeting: felt252);
}

#[starknet::contract]
mod HelloStarknet {
    use starknet::storage::{
        StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

    #[storage]
    struct Storage {
        balance: u256,
        greeting: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, greeting: felt252) {
        self.greeting.write(greeting);
        self.balance.write(0);
    }

    #[external(v0)]
    fn get_balance(self: @ContractState) -> u256 {
        self.balance.read()
    }

    #[external(v0)]
    fn increase_balance(ref self: ContractState, amount: u256) {
        self.balance.write(self.balance.read() + amount);
    }

    #[external(v0)]
    fn get_greeting(self: @ContractState) -> felt252 {
        self.greeting.read()
    }

    #[external(v0)]
    fn set_greeting(ref self: ContractState, greeting: felt252) {
        self.greeting.write(greeting);
    }
}
