import React, { useState, useEffect } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import {
	Button,
	Column,
	HorizontalDivider,
	InputField,
	Typography,
} from "@cred/neopop-web/lib/components";
import { colorPalette, FontVariant } from "@cred/neopop-web/lib/primitives";
import twitterLogo from "./assets/twitter-logo.svg";
import idl from "./utils/idl.json";
import kp from "./keypair.json";
import "./App.css";

// reference to the Solana runtime
const { SystemProgram } = web3;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// get our program's id from the IDL file
const programID = new PublicKey(idl.metadata.address);

// set our network to devnet.
const network = clusterApiUrl("devnet");

// controls how we want to acknowledge when a transaction is "done".
const opts = {
	preflightCommitment: "processed",
};

const TWITTER_HANDLE = "priyansh_71";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
	const [walletAddress, setWalletAddress] = useState(null);
	const [contentLink, setContentLink] = useState("");
	const [caption, setCaption] = useState("");
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
		if (contentLink.length === 0) {
			console.log("No content given!");
			return;
		}
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);

			await program.rpc.addContent(contentLink, caption, {
				accounts: {
					baseAccount: baseAccount.publicKey,
					user: provider.wallet.publicKey,
				},
			});
			console.log("Content sent : ", contentLink);

			setContentLink("");
			setCaption("");
			await getContentList();
		} catch (error) {
			console.log("Error sending content:", error);
		}
	};

	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img
				src="https://media.giphy.com/media/l0NwGpoOVLTAyUJSo/giphy.gif"
				width="600px"
				alt="Batman GIF"
			/>
			<Button
				variant="elevated"
				style={{
					margin: "auto",
					fontFamily: "Montserrat",
				}}
				textStyle={{
					fontSize: 18,
					fontWeight: "bold",
				}}
				kind="elevated"
				borderColor="#244234"
				elevationDirection="left-bottom"
				size="big"
				colorMode="dark"
				color="#244234"
				onClick={connectWallet}
			>
				Connect Wallet
			</Button>
		</div>
	);

	const renderConnectedContainer = () =>
		contentList === null ? (
			<div className="connected-container">
				<Button
					variant="elevated"
					style={{
						margin: "auto",
						fontFamily: "Montserrat",
					}}
					textStyle={{
						fontSize: 18,
						fontWeight: "bold",
					}}
					kind="elevated"
					borderColor="#244234"
					elevationDirection="left-bottom"
					size="big"
					colorMode="dark"
					color="#244234"
					onClick={createAccountForContent}
				>
					Do One-Time initialization of content's Solana Account
				</Button>
			</div>
		) : (
			<Column>
				<form
					onSubmit={event => {
						event.preventDefault();
						sendContent();
					}}
				>
					<div className="connected-inputs">
						<InputField
							value={contentLink}
							label="Content Link"
							onChange={e => setContentLink(e.target.value)}
							inputMode="url"
							colorConfig={{
								textColor: "#fefefe",
								placeholderColor: "#aeaeae",
							}}
							textStyle={{
								label: {
									fontSize: 16,
								},
							}}
							colorMode="dark"
							placeholder="Enter content link!"
						/>
						<InputField
							label="Caption"
							inputMode="text"
							colorMode="dark"
							colorConfig={{
								textColor: "#fefefe",
								placeholderColor: "#aeaeae",
							}}
							textStyle={{
								label: {
									fontSize: 16,
								},
							}}
							value={caption}
							onChange={e => setCaption(e.target.value)}
							placeholder="Fancy a caption?"
						/>
					</div>
					<Button
						variant="elevated"
						typeof="submit"
						className="cta-button"
						textStyle={{
							fontSize: 18,
							fontWeight: "bold",
						}}
						showArrow={true}
						kind="elevated"
						elevationDirection="left-bottom"
						size="big"
						colorMode="dark"
						color="#244234"
					>
						Submit
					</Button>
				</form>

				<center>
					<HorizontalDivider
						color={colorPalette.popBlack[100]}
						style={{
							width: "80vw",
							textAlign: "center",
						}}
					/>
					;
				</center>

				<div className="gif-grid">
					{contentList.map((item, index) => (
						<Column className="gif-item v-center" key={index}>
							<img src={item.contentLink} alt={item} />
							<Typography
								{...FontVariant.CirkaHeadingBold18}
								color={colorPalette.success[100]}
								style={{
									fontFamily: "Quicksand",
									textAlign: "center",
								}}
							>
								{item.caption}
							</Typography>
						</Column>
					))}
				</div>
			</Column>
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
					<Typography
						{...FontVariant.HeadingBold20}
						color={colorPalette.popWhite[500]}
						style={{
							fontFamily: "Quicksand",
							margin: "20px",
						}}
					>
						Post regarding anything in DC.
					</Typography>
				</div>

				{walletAddress
					? renderConnectedContainer()
					: renderNotConnectedContainer()}

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
