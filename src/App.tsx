import './App.css';
import React, { useState, useEffect, ReactElement } from 'react';
import motokoLogo from './assets/motoko_moving.png';
import motokoShadowLogo from './assets/motoko_shadow.png';
import reactLogo from './assets/bob.png';
import viteLogo from './assets/corn.png';
import { useQueryCall, useUpdateCall } from '@ic-reactor/react';
import { Principal } from '@dfinity/principal';
import {Agent, Actor, HttpAgent} from '@dfinity/agent';

import { idlFactory as icpFactory} from './declarations/nns-ledger';
import { _SERVICE as icpService } from './declarations/nns-ledger/index.d';

import { idlFactory as reBobFactory} from './declarations/backend';
import { _SERVICE as reBobService} from './declarations/backend/index.d';
import {  Stats } from './declarations/backend/backend.did.d';

const bobLedgerID = "7pail-xaaaa-aaaas-aabmq-cai";
const reBobCanisterID = "bd3sg-teaaa-aaaaa-qaaba-cai";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [icpBalance, setIcpBalance] = useState<bigint>(0n);
  const [bobLedgerBalance, setBobLedgerBalance] = useState<bigint>(0n);
  const [reBobLedgerBalance, setreBobLedgerBalance] = useState<bigint>(0n);
  const [share, setShare] = useState<bigint>(0n);
  const [stats, setStats] = useState<Stats | null>(null);

  const [reBobActor, setreBobActor] = useState<reBobService |null>(null);
  const [reBobActorTemp, setreBobActorTemp] = useState<reBobService |null>(null);
  const [bobLedgerActor, setBobLedgerActor] = useState<icpService | null>(null);
  const [yourPrincipal, setYourPrincipal] = useState<string>("null");

  function bigintToFloatString(bigintValue : bigint, decimals = 8) {
    const stringValue = bigintValue.toString();
    // Ensure the string is long enough by padding with leading zeros if necessary
    const paddedStringValue = stringValue.padStart(decimals + 1, '0');
    // Insert decimal point decimals places from the end
    const beforeDecimal = paddedStringValue.slice(0, -decimals);
    const afterDecimal = paddedStringValue.slice(-decimals);
    // Combine and trim any trailing zeros after the decimal point for display
    const result = `${beforeDecimal}.${afterDecimal}`.replace(/\.?0+$/, '');
    return result;
  }
  


  const checkConnection = async () => {
    try {
      // Assuming window.ic?.plug?.isConnected() is a Promise-based method
      
      const connected = await window.ic.plug.isConnected();
      if(connected){
        await handleLogin();
      } else {
        
      }
      
    } catch (error) {
      console.error("Error checking connection status:", error);
      // Handle any errors, for example, by setting an error state
    }
  };

  useEffect(() => {
    
    console.log("Component mounted, waiting for user to log in...");
    //console.log("first time", isConnected);
    //checkConnection();
  }, []); // Dependency array remains empty if you only want this effect to run once on component mount

  useEffect(() => {
    // This code runs after `icpActor` and `icdvActor` have been updated.
    console.log("actors updated", bobLedgerActor, reBobActor);
  
    fetchBalances();
    //fetchMinters();
    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [bobLedgerActor, reBobActor]);

  useEffect(() => {
    // This code runs after `icpActor` and `icdvActor` have been updated.
    //console.log("actors updated", icpActor, bobActor, bobLedgerActor, reBobActor);
  
    fetchStats();
    //fetchMinters();
    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [reBobActorTemp]);

  useEffect(() => {
    // This code runs after `icpActor` and `icdvActor` have been updated.
    if (isConnected) {
      
      fetchPrincipal();
      // Ensure fetchBalances is defined and correctly handles asynchronous operations
      setUpActors();
    };

    console.log("isConnected", isConnected);

    // Note: If `fetchBalances` depends on `icpActor` or `icdvActor`, you should ensure it's capable of handling null values or wait until these values are not null.
  }, [isConnected]);

  const fetchPrincipal = async () => {
    if(!(await window.ic.plug.agent)) return;
    setYourPrincipal((await window.ic.plug.agent.getPrincipal()).toString());
  };

  const fetchStats = async () => {
    

    if(reBobActorTemp != null){
      let stats = await reBobActorTemp.stats();
      await setStats(stats);
    };
  };



  const setUpActors = async () => {

    console.log("Setting up actors...", bobLedgerID, reBobCanisterID);

  

    const getreBobActor = await window.ic.plug.createActor({
      canisterId: reBobCanisterID,
      interfaceFactory: reBobFactory,
    })

    await setreBobActor(getreBobActor);



    await setBobLedgerActor(await window.ic.plug.createActor({
      canisterId: bobLedgerID,
      interfaceFactory: icpFactory,
    }));
    
    console.log("actors", bobLedgerActor);
  };

  const fetchBalances = async () => {
    // Assuming icdvFactory and icpFactory are your actor factories
    // You'd need to replace this with actual logic to instantiate your actors and fetch balances
    // This is a placeholder for actor creation and balance fetching

    console.log("Fetching balances...", bobLedgerActor, reBobActor);
    if(bobLedgerActor === null ||  reBobActor === null ) return;
    // Fetch balances (assuming these functions return balances in a suitable format)
  
    console.log("Fetching balances...", icpBalance);

    let bobLedgerBalance = await bobLedgerActor.icrc1_balance_of({
      owner: await window.ic.plug.agent.getPrincipal(),
      subaccount: [],
    });

    await setBobLedgerBalance(bobLedgerBalance);

    console.log("Fetching balances...", bobLedgerBalance);
    
    let reBobLedgerBalance = await reBobActor.icrc1_balance_of({
      owner: await window.ic.plug.agent.getPrincipal(),
      subaccount: [],
    });

    await setreBobLedgerBalance(reBobLedgerBalance);

    console.log("Fetching balances...", reBobLedgerBalance);

      console.log("Balances fetched:", bobLedgerBalance, icpBalance, reBobLedgerBalance);
   
  };



  const handleLogout = async () => {
    setLoading(true);
    try {
      await window.ic.plug.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
      try {

        
        
        const connected = await window.ic.plug.isConnected();
        if (!connected) {
          let pubkey = await window.ic.plug.requestConnect({
            // whitelist, host, and onConnectionUpdate need to be defined or imported appropriately
            whitelist: [bobLedgerID, reBobCanisterID],
            host: window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1') ? 'http://127.0.0.1:8000' : 'https://ic0.app',
            onConnectionUpdate: async () => {
              console.log("Connection updated", await window.ic.plug.isConnected());
              await setIsConnected(!!await window.ic.plug.isConnected());
            },
          });
          if(window.location.href.includes('localhost') || window.location.href.includes('127.0.0.1')){
            await window.ic.plug.sessionManager.sessionData.agent.agent.fetchRootKey();
          };
          console.log("Connected with pubkey:", pubkey);
          await setIsConnected(true);
        } else {
          if (window.location.href.includes("localhost") || window.location.href.includes("127.0.0.1")) {
            await window.ic.plug.sessionManager.sessionData.agent.agent.fetchRootKey();
          };
          setIsConnected(true);
          //await handleLogin();
        };
      } catch (error) {
        console.error('Login failed:', error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    
  };

  const handleMint = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    
    const amountToMint = prompt("Enter the amount of Bob to use to mint reBob:");
    const amountInE8s = BigInt(Number(amountToMint) * 100000000);

    if (amountInE8s + 20000n > bobLedgerBalance) {
      alert("You do not have enough Bob.");
      return;
    }

    if(!bobLedgerActor || !reBobActor) return;

    setLoading(true);
    try {
      // Assuming icpActor and icdvActor are already initialized actors
      const approvalResult  = await bobLedgerActor.icrc2_approve({
        amount: amountInE8s + 10000n,
        // Adjust with your canister ID and parameters
        spender: {
          owner: await Principal.fromText(reBobCanisterID),
          subaccount: [],
        },
        memo: [],
        fee: [10000n],
        created_at_time: [BigInt(Date.now()) * 1000000n],
        expires_at: [],
        expected_allowance: [],
        from_subaccount: [],
      });

      if ("Ok" in approvalResult) {
        alert("This may take a long time! Your ICP has been authorized for minting. Please click ok and wait for the transaction to complete. A message box should appear after a few seconds.");
        let result = await reBobActor.deposit([], amountInE8s );
        if("ok" in result){
          alert("Mint successful! Block: " + result.ok.toString() + ".");
        } else {  
          alert("Mint failed! " + result.err.toString());
        };
        fetchBalances();
        fetchStats();
      } else {
        alert("Mint failed.");
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
      await fetchBalances();
      await fetchStats();
    }
  };


  const handleWithdrawl = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    
    const amountToMint = prompt("Enter the amount of reBob to use to withdraw Bob:");
    const amountInE8s = BigInt(Number(amountToMint) * 1000000);

    if (amountInE8s + 20000n > reBobLedgerBalance) {
      alert("You do not have enough reBob.");
      return;
    }

    if(!bobLedgerActor || !reBobActor) return;

    setLoading(true);
    try {
      // Assuming icpActor and icdvActor are already initialized actors
      const approvalResult  = await reBobActor.icrc2_approve({
        amount: amountInE8s + 10000n,
        // Adjust with your canister ID and parameters
        spender: {
          owner: await Principal.fromText(reBobCanisterID),
          subaccount: [],
        },
        memo: [],
        fee: [10000n],
        created_at_time: [BigInt(Date.now()) * 1000000n],
        expires_at: [],
        expected_allowance: [],
        from_subaccount: [],
      });

      if ("Ok" in approvalResult) {
        alert("This may take a while! Your ICP has been authorized for minting. Please click ok and wait for the transaction to complete. A message box should appear after a few seconds.");
        let result = await reBobActor.withdraw([], amountInE8s - 10000n );
        if("ok" in result){
          alert("Withdraw successful! Block: " + result.ok.toString() + ".");
        } else {  
          console.log("fund failed", result);
          alert("Withdraw failed! " + result.err.toString());
        };
        fetchBalances();
        fetchStats();
      } else {
        console.log("Approval failed", approvalResult); 
        alert("Withdraw failed." + + approvalResult.Err.toString());
      }
    } catch (error) {
      console.error('Minting failed:', error);
      alert("An error occurred.");
    } finally {
      setLoading(false);
      await fetchBalances();
      await fetchStats();
    }
  };

  

  return (
    <div className="App">
      <div>
        <a href="https://aalgg-jaaaa-aaaak-afkwq-cai.icp0.io/" target="_blank">
          <img src={viteLogo} className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://bob.fun" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a
          href="https://internetcomputer.org/docs/current/developer-docs/build/cdks/motoko-dfinity/motoko/"
          target="_blank"
        >
          <span className="logo-stack">
            <img
              src={motokoShadowLogo}
              className="logo motoko-shadow"
              alt="Motoko logo"
            />
            <img src={motokoLogo} className="logo motoko" alt="Motoko logo" />
          </span>
        </a>
      </div>
      <h1>BOB rehasher & exohasher</h1>
      <h2>Enlarge your Bob</h2>
      
      
      
      <div className="card">
      </div>
      <div className="card">
        
        {!isConnected ? (
          <button onClick={handleLogin} disabled={loading}>Login with Plug</button>
        ) : (
          <>
            <button onClick={handleLogout} disabled={loading}>Logout</button>
            <h3>Your current $rebob Balance: {bigintToFloatString(reBobLedgerBalance, 6)}</h3>
            <h3>Your current $Bob Balance: {bigintToFloatString(bobLedgerBalance)}</h3>
            <div className="card">
            {bobLedgerBalance < 40000 ? (
              <div>
                <p>You need more BOB to mint reBob. Send At least .0004 BOB to your principal. Your principal is {yourPrincipal}</p>
              </div>
            ) : (
              <div>
              <p>You can mint reBob. <br/>Your principal is {yourPrincipal}</p>
              <button onClick={handleMint} disabled={loading}>
                {"Click here to mint reBob"}
              </button>
              <p></p>
              {
                reBobLedgerBalance > 400n ? (
                  <button onClick={handleWithdrawl} disabled={loading}>
                    {"Click here to withdraw Bob"}
                  </button>
                ) : (<p>Once you have more than 400 reBob you can withdraw Bob.</p>)
              }
              </div>
            )}
          </div>
          
          </>
        )
        }
      </div>
      <p className="read-the-docs">
       Bitcorn Labs presents: build on bob Bob  Click logos to learn more.
      </p>
    </div>
  );
}

export default App;
