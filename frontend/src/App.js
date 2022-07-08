import React, { useState, useEffect } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import twitterLogo from "./assets/twitter-logo.svg";
import idl from "./utils/idl.json";
import kp from './keypair.json'
import "./App.css";

// reference to the Solana runtime
const { SystemProgram } = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret);

// get our program's id from the IDL file
const programID = new PublicKey(idl.metadata.address);

// set our network to devnet.
const network = clusterApiUrl("devnet");

// controls how we want to acknowledge when a transaction is "done".
const opts = {
	preflightCommitment: "processed",
};

// const TEST_GIFS = [
// 	{
// 		link: "https://media.giphy.com/media/4eGUxJc4lplh6/giphy.gif",
// 		comment: "I love the way Batman's eyes are shown in animations",
// 	},
// 	{
// 		link: "https://media.giphy.com/media/3oEjI4MOMgxg3apmMg/giphy.gif",
// 		comment: "Arrow made me appreciate DC so much more.",
// 	},
// 	{
// 		link: "https://media.giphy.com/media/xwvT0qtK4FtgQ/giphy.gif",
// 		comment: "Wonder woman is <3.",
// 	},
// 	{
// 		link: "https://media.giphy.com/media/dzgqtSFuYRCwg/giphy.gif",
// 		comment: "Best supervillian ever.",
// 	},
// ];
const TWITTER_HANDLE = "priyansh_71";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
	const [walletAddress, setWalletAddress] = useState(null);
	const [link, setLink] = useState("");
	const [comment, setComment] = useState("");
	const [contentList, setContentList] = useState([]);


	const checkIfWalletIsConnected = async () => {
		try {
			const { solana } = window;

			if (solana) {
				if (!solana.isPhantom) {
					console.log("Please install Phantom Wallet.");
				}

				const response = await solana.connect({ onlyIfTrusted: true });
				console.log(
					"Connected with Public Key:",
					response.publicKey.toString()
				);
				setWalletAddress(response.publicKey.toString());
			} else {
				alert("Solana object not found! Get a Phantom Wallet 👻");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const connectWallet = async () => {
		try {
			const { solana } = window;

			if (solana) {
				const response = await solana.connect();
				console.log(
					"Connected with Public Key:",
					response.publicKey.toString()
				);
				setWalletAddress(response.publicKey.toString());
			}
		} catch (err) {
			console.log(err);
		}
	};

	const getProvider = () => {
		const connection = new Connection(network, opts.preflightCommitment);
		const provider = new Provider(
			connection,
			window.solana,
			opts.preflightCommitment
		);
		return provider;
	};

	const createAccountForContent = async () => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			console.log("Account Initializing...");
			await program.rpc.initialize({
				accounts: {
					baseAccount: baseAccount.publicKey,
					user: provider.wallet.publicKey,
					systemProgram: SystemProgram.programId,
				},
				signers: [baseAccount],
			});
			console.log(
				"Created a new BaseAccount w/ address :",
				baseAccount.publicKey.toString()
			);
			await getContentList();
		} catch (error) {
			console.log("Error creating BaseAccount account:", error);
		}
	};

	const sendContent = async () => {
		if(link.length === 0){
			console.log("No gif link given!")
			return
		}
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
		
			await program.rpc.addContent(link, comment, {
			  accounts: {
				baseAccount: baseAccount.publicKey,
				user: provider.wallet.publicKey,
			  },
			});
			console.log("Content sent : ", link)
			
			setLink("");
			setComment("");
			await getContentList();
		  } catch (error) {
			console.log("Error sending content:", error)
		  }
		};

	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img
				src="https://media.giphy.com/media/ItCjeMCC34gZG/giphy.gif"
				height="320px"
				alt="Batman GIF"
			/>
			<button
				className="cta-button connect-wallet-button"
				onClick={connectWallet}
			>
				Connect Wallet
			</button>
		</div>
	);

	const renderConnectedContainer = () =>
		contentList === null ? (
			<div className="connected-container">
				<button
					className="cta-button submit-gif-button"
					onClick={createAccountForContent}
				>
					Do One-Time Initialization content's Solana Account
				</button>
			</div>
		) : (
			<div className="connected-container">
				<form
					onSubmit={event => {
						event.preventDefault();
						sendContent();
					}}
				>
					<div className="connected-inputs">
						<input
							type="text"
							value={link}
							onChange={e => setLink(e.target.value)}
							id="gif"
							placeholder="Enter gif link!"
						/>
						<input
							type="text"
							id="comment"
							value={comment}
							onChange={e => setComment(e.target.value)}
							placeholder="Any comments?"
						/>
					</div>
					<button type="submit" className="cta-button submit-gif-button">
						Submit
					</button>
				</form>
				<div className="gif-grid">
					{contentList.map((item,index) => (
						<div className="gif-item" key={index}>
							<img src={item.contentLink} alt={item} />
							<span>{item.caption}</span>
						</div>
					))}
				</div>
			</div>
		);

	const getContentList = async () => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			const account = await program.account.baseAccount.fetch(
				baseAccount.publicKey
			);

			console.log("Got the account : ", account);
			setContentList(account.contentList);
		} catch (error) {
			console.log("Error in getContentList() : ", error.message);
			setContentList(null);
		}
	};

	useEffect(() => {
		const onLoad = async () => {
			await checkIfWalletIsConnected();
		};
		window.addEventListener("load", onLoad);
		return () => window.removeEventListener("load", onLoad);
	}, []);

	useEffect(() => {
		if (walletAddress) {
			console.log("Fetching ...");
			getContentList();
		}
	}, [walletAddress]);

	return (
		<div className="App">
			<div className={walletAddress ? "authed-container" : "container"}>
				<div className="header-container">
					<p className="header">
						<img
							src="https://www.pngall.com/wp-content/uploads/11/DC-Comics-Logo-PNG-File.png"
							id="DC"
							alt="Hello"
						/>
						&nbsp;Fandom
					</p>
					<p className="sub-text">
						Post regarding literally <strong>anything</strong> in DC.
					</p>
				</div>

				{walletAddress ? renderConnectedContainer() : renderNotConnectedContainer()}

				<div className="footer-container">
					<img
						alt="Twitter Logo"
						className="twitter-logo"
						src={twitterLogo}
					/>
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer noopener"
					>
						@{TWITTER_HANDLE}
					</a>
				</div>
			</div>
		</div>
	);
};

export default App;
