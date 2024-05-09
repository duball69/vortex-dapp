

async function main() {

//deploy token

  const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the wallet:", deployer.address);
  
    const MyToken = await ethers.getContractFactory("MyToken");
    const myTokenDeployment = await MyToken.deploy("Hipopotamus", "HIPO", 420);
  
    if (myTokenDeployment) {
      // If successful, print contract address
      console.log("MyToken address:", myTokenDeployment.target);
  } else {
      // If unsuccessful, log an error
      console.error("MyToken deployment failed");
      return; // Exit the function
  }



  
    const positionManager_address = "0x1238536071E1c677A632429e3655c799b22cDA52";
    const WETH_address = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
    const uniswapV3Factory_address = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";

    const MyFactory = await ethers.getContractFactory("MyFactory");
    const myFactory = await MyFactory.deploy(positionManager_address, WETH_address, uniswapV3Factory_address);
  
    console.log("MyFactory address:", myFactory.target);

  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    }); 
  