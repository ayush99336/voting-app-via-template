#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

#[program]
pub mod votingappviatemplate {
    use super::*;

    pub fn close(_ctx: Context<CloseVotingappviatemplate>) -> Result<()> {
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.votingappviatemplate.count = ctx.accounts.votingappviatemplate.count.checked_sub(1).unwrap();
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.votingappviatemplate.count = ctx.accounts.votingappviatemplate.count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn initialize(_ctx: Context<InitializeVotingappviatemplate>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
        ctx.accounts.votingappviatemplate.count = value.clone();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVotingappviatemplate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  init,
  space = 8 + Votingappviatemplate::INIT_SPACE,
  payer = payer
    )]
    pub votingappviatemplate: Account<'info, Votingappviatemplate>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseVotingappviatemplate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  mut,
  close = payer, // close account and return lamports to payer
    )]
    pub votingappviatemplate: Account<'info, Votingappviatemplate>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub votingappviatemplate: Account<'info, Votingappviatemplate>,
}

#[account]
#[derive(InitSpace)]
pub struct Votingappviatemplate {
    count: u8,
}
