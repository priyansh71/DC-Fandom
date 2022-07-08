use anchor_lang::prelude::*;

declare_id!("3LKwP6PniJASRhjm4JvcdThyG7VAanYzSwA2QWP1za6a");

#[program]
pub mod fandomproject {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_content = 0;

        Ok(())
    }

    pub fn add_content(ctx : Context<AddContent>, content_link : String, caption : String) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;
        
        // Build structure 
        let item = FandomStruct {
            content_link: content_link.to_string(),
            caption: caption.to_string(),
            user_address : *user.to_account_info().key,
        };

        base_account.content_list.push(item);
        base_account.total_content += 1;

        Ok(())
    }
}

//  The context that we utilize to initialize our rust program.
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program <'info, System>,
}

//  The context that we utilize in the add_content function.
#[derive(Accounts)]
pub struct AddContent<'info> {
  #[account(mut)]
  pub base_account: Account<'info, BaseAccount>,
  #[account(mut)]
  pub user: Signer<'info>,
}

// The structure that we will store the content that needs to be pushed from the fronted.
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct FandomStruct {
    pub content_link: String,
    pub caption: String,
    pub user_address: Pubkey,
}

// Tell Solana what variables we want to store on this particular account.
#[account]
pub struct BaseAccount {
    pub total_content : u64,
    pub content_list : Vec<FandomStruct>,
}
