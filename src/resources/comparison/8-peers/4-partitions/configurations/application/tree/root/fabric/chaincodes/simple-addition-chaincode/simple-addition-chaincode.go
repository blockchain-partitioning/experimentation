package main

import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"strconv"
)

const errorWrongFormat = "{\"code\":301, \"reason\": \"Could not find an appropriate command. Must be 'update'\"}"

type SimpleAdditionChaincode struct {
}

func (s *SimpleAdditionChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

func (s *SimpleAdditionChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()

	if function == "update" {
		return s.update(stub, args)
	}

	return shim.Error(errorWrongFormat)
}

func (s *SimpleAdditionChaincode) update(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// Check we have a valid number of args
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments, expecting 3")
	}

	// Extract the args
	name := args[0]
	op := args[2]
	_, err := strconv.ParseFloat(args[1], 64)
	if err != nil {
		return shim.Error("Provided value was not a number")
	}

	// Make sure a valid operator is provided
	if op != "+" && op != "-" {
		return shim.Error(fmt.Sprintf("Operator %s is unrecognized", op))
	}

	// Retrieve info needed for the update procedure
	txid := stub.GetTxID()
	compositeIndexName := "varName~op~value~txID"

	// Create the composite key that will allow us to query for all deltas on a particular variable
	compositeKey, compositeErr := stub.CreateCompositeKey(compositeIndexName, []string{name, op, args[1], txid})
	if compositeErr != nil {
		return shim.Error(fmt.Sprintf("Could not create a composite key for %s: %s", name, compositeErr.Error()))
	}

	// Save the composite key index
	compositePutErr := stub.PutState(compositeKey, []byte{0x00})
	if compositePutErr != nil {
		return shim.Error(fmt.Sprintf("Could not put operation for %s in the ledger: %s", name, compositePutErr.Error()))
	}

	return shim.Success([]byte(fmt.Sprintf("Successfully added %s%s to %s", op, args[1], name)))
}

func main() {
	err := shim.Start(new(SimpleAdditionChaincode))
	if err != nil {
		fmt.Printf("Error starting chaincode: %v \n", err)
	}
}
