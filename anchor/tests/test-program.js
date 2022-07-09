const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

const main = async () => {
  console.log("🚀 Starting test...");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Fandomproject;
  const baseAccount = anchor.web3.Keypair.generate();

  let tx = await program.rpc.initialize({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });

  console.log("Your transaction signature is : ", tx);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log("Content count", account.totalContent.toString());

  await program.rpc.addContent(
    "https://media.giphy.com/media/oMLJaPmbUnoC4/giphy.gif",
    "Batsignal is insanely accurate",
    {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    }
  );

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log("Content count", account.totalContent.toString());

  console.log("Content list", account.contentList);

  await program.rpc.updateContent( "0", {
    accounts: {
      baseAccount: baseAccount.publicKey,
    }
  });

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log("Content list", account.contentList);
  console.log("🚀 Test finished.");
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runMain();