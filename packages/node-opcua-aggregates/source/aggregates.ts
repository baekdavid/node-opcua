/**
 * @module node-opca-aggregates
 */
import { ObjectIds } from "node-opcua-constants";
import { makeNodeId } from "node-opcua-nodeid";
import * as utils from "node-opcua-utils";
import { DataType } from "node-opcua-variant";

import { AddressSpace, BaseNode, UAObject, UAServerCapabilities, UAVariable } from "node-opcua-address-space";
import { AggregateConfigurationOptionsEx } from "./interval";
// import { HistoryServerCapabilities } from "node-opcua-server";

/*
HasProperty Variable AccessHistoryDataCapability Boolean PropertyType Mandatory
HasProperty Variable AccessHistoryEventsCapability Boolean PropertyType Mandatory
HasProperty Variable MaxReturnDataValues UInt32 PropertyType Mandatory
HasProperty Variable MaxReturnEventValues UInt32 PropertyType Mandatory
HasProperty Variable InsertDataCapability Boolean PropertyType Mandatory
HasProperty Variable ReplaceDataCapability Boolean PropertyType Mandatory
HasProperty Variable UpdateDataCapability Boolean PropertyType Mandatory
HasProperty Variable DeleteRawCapability Boolean PropertyType Mandatory
HasProperty Variable DeleteAtTimeCapability Boolean PropertyType Mandatory
HasProperty Variable InsertEventCapability Boolean PropertyType Mandatory
HasProperty Variable ReplaceEventCapability Boolean PropertyType Mandatory
HasProperty Variable UpdateEventCapability Boolean PropertyType Mandatory
HasProperty Variable DeleteEventCapability Boolean PropertyType Mandatory
HasProperty Variable InsertAnnotationsCapability Boolean PropertyType Mandatory
 */
const historicalCapabilitiesDefaultProperties /*: HistoryServerCapabilities */ = {
    accessHistoryDataCapability: true, // Boolean PropertyType Mandatory
    accessHistoryEventsCapability: true, // Boolean PropertyType Mandatory
    deleteAtTimeCapability: false, // Boolean PropertyType Mandatory
    deleteEventCapability: false, // Boolean PropertyType Mandatory
    deleteRawCapability: false, // Boolean PropertyType Mandatory
    insertAnnotationCapability: false, // Boolean PropertyType Mandatory
    insertDataCapability: false, // Boolean PropertyType Mandatory
    insertEventCapability: false, // Boolean PropertyType Mandatory
    maxReturnDataValues: 0,
    maxReturnEventValues: 0, // UInt32 PropertyType Mandatory
    replaceDataCapability: false, // Boolean PropertyType Mandatory
    replaceEventCapability: false, // Boolean PropertyType Mandatory
    updateDataCapability: false, // Boolean PropertyType Mandatory
    updateEventCapability: false // Boolean PropertyType Mandatory
};

export function createHistoryServerCapabilities(
  addressSpace: AddressSpace,
  serverCapabilities: UAServerCapabilities
): UAObject {

    /* istanbul ignore next */
    if (serverCapabilities.browseName.toString() !== "ServerCapabilities") {
        throw new Error("Expecting server Capabilities");
    }

    const historyServerCapabilitiesType = addressSpace.getNamespace(0).findObjectType("HistoryServerCapabilitiesType")!;

    /* istanbul ignore next */
    if (!historyServerCapabilitiesType) {
        throw new Error("Cannot find HistoryServerCapabilitiesType");
    }
    return historyServerCapabilitiesType.instantiate({
        browseName: "HistoryServerCapabilities",
        componentOf: serverCapabilities
    });
}

function setHistoricalServerCapabilities(
  historyServerCapabilities: any,
  defaultProperties: any
) {
    function setBoolean(propName: string) {
        const lowerCase = utils.lowerFirstLetter(propName);

        /* istanbul ignore next */
        if (!defaultProperties.hasOwnProperty(lowerCase)) {
            throw new Error("cannot find " + lowerCase);
        }
        const value = defaultProperties[lowerCase];
        const prop = historyServerCapabilities.getChildByName(propName);

        /* istanbul ignore next */
        if (!prop) {
            throw new Error(" Cannot find property " + propName);
        }
        prop.setValueFromSource({ dataType: DataType.Boolean, value });

    }

    function setUInt32(propName: string) {
        const lowerCase = utils.lowerFirstLetter(propName);
        /* istanbul ignore next */
        if (!historyServerCapabilities.hasOwnProperty(lowerCase)) {
            throw new Error("cannot find " + lowerCase);
        }
        const value = defaultProperties[lowerCase];
        const prop = historyServerCapabilities.getChildByName(propName);
        prop.setValueFromSource({ dataType: DataType.UInt32, value });
    }

    setBoolean("AccessHistoryDataCapability");
    setBoolean("AccessHistoryEventsCapability");

    setUInt32("MaxReturnDataValues");
    setUInt32("MaxReturnEventValues");

    setBoolean("InsertDataCapability");
    setBoolean("ReplaceDataCapability");
    setBoolean("UpdateDataCapability");
    setBoolean("DeleteRawCapability");
    setBoolean("DeleteAtTimeCapability");
    setBoolean("InsertEventCapability");
    setBoolean("ReplaceEventCapability");
    setBoolean("UpdateEventCapability");
    setBoolean("DeleteEventCapability");

    /// FOUND A BUG HERE spec says InsertAnnotationsCapability
    /// Standard dnodeset2 says InsertAnnotationCapability ( without s )
    // xx setBoolean("InsertAnnotationsCapability");
}

export type AggregateFunctioName =
  "AnnotationCount" |
  "Average" |
  "Count" |
  "Delta" |
  "DeltaBounds" |
  "DurationBad" |
  "DurationGood" |
  "DurationInStateNonZero" |
  "DurationInStateZero" |
  "EndBound" |
  "Interpolative" |
  "Maximum" |
  "Maximum2" |
  "MaximumActualTime" |
  "MaximumActualTime2" |
  "Minimum" |
  "Minimum2" |
  "MinimumActualTime" |
  "MinimumActualTime2" |
  "NumberOfTransitions" |
  "PercentBad" |
  "PercentGood" |
  "Range" |
  "Range2" |
  "StandardDeviationPopulation" |
  "StandardDeviationSample" |
  "Start" |
  "StartBound" |
  "TimeAverage" |
  "TimeAverage2" |
  "Total" |
  "Total2" |
  "VariancePopulation" |
  "VarianceSample" |
  "WorstQuality" |
  "WorstQuality2";

function addAggregateFunctionSupport(
  addressSpace: AddressSpace, functionName: number): void {

    /* istanbul ignore next */
    if (!functionName) {
        throw new Error("Invalid function name");
    }

    const serverCapabilities = addressSpace.rootFolder.objects.server.serverCapabilities;

    /* istanbul ignore next */
    if (!serverCapabilities.historyServerCapabilities) {
        throw new Error("missing serverCapabilities.historyServerCapabilities");
    }

    const aggregateFunctions = serverCapabilities.aggregateFunctions;

    const aggregateFunctionsInHist = serverCapabilities.historyServerCapabilities.aggregateFunctions;

    const functionNodeId = makeNodeId(functionName);
    const functionNode = addressSpace.getNamespace(0).findNode(functionNodeId);

    /* istanbul ignore next */
    if (!functionNode) {
        throw new Error("Cannot find node " + functionName + " in addressSpace");
    }

    aggregateFunctions.addReference({
        nodeId: functionNode.nodeId,
        referenceType: "Organizes"
    });
    aggregateFunctionsInHist.addReference({
        nodeId: functionNode.nodeId,
        referenceType: "Organizes"
    });
}

const enum AggregateFunction {
    AnnotationCount = ObjectIds.AggregateFunction_AnnotationCount,
    Average = ObjectIds.AggregateFunction_Average,
    Count = ObjectIds.AggregateFunction_Count,
    Delta = ObjectIds.AggregateFunction_Delta,
    DeltaBounds = ObjectIds.AggregateFunction_DeltaBounds,
    DurationBad = ObjectIds.AggregateFunction_DurationBad,
    DurationGood = ObjectIds.AggregateFunction_DurationGood,
    DurationInStateNonZero = ObjectIds.AggregateFunction_DurationInStateNonZero,
    DurationInStateZero = ObjectIds.AggregateFunction_End,
    EndBound = ObjectIds.AggregateFunction_EndBound,
    Interpolative = ObjectIds.AggregateFunction_Interpolative,
    Maximum = ObjectIds.AggregateFunction_Maximum,
    Maximum2 = ObjectIds.AggregateFunction_Maximum2,
    MaximumActualTime = ObjectIds.AggregateFunction_MaximumActualTime,
    MaximumActualTime2 = ObjectIds.AggregateFunction_MaximumActualTime2,
    Minimum = ObjectIds.AggregateFunction_Minimum,
    Minimum2 = ObjectIds.AggregateFunction_Minimum2,
    MinimumActualTime = ObjectIds.AggregateFunction_MinimumActualTime,
    MinimumActualTime2 = ObjectIds.AggregateFunction_MinimumActualTime2,
    NumberOfTransitions = ObjectIds.AggregateFunction_NumberOfTransitions,
    PercentBad = ObjectIds.AggregateFunction_PercentBad,
    PercentGood = ObjectIds.AggregateFunction_PercentGood,
    Range = ObjectIds.AggregateFunction_Range,
    Range2 = ObjectIds.AggregateFunction_Range2,
    StandardDeviationPopulation = ObjectIds.AggregateFunction_StandardDeviationPopulation,
    StandardDeviationSample = ObjectIds.AggregateFunction_StandardDeviationSample,
    Start = ObjectIds.AggregateFunction_Start,
    StartBound = ObjectIds.AggregateFunction_StartBound,
    TimeAverage = ObjectIds.AggregateFunction_TimeAverage,
    TimeAverage2 = ObjectIds.AggregateFunction_TimeAverage2,
    Total = ObjectIds.AggregateFunction_Total,
    Total2 = ObjectIds.AggregateFunction_Total2,
    VariancePopulation = ObjectIds.AggregateFunction_VariancePopulation,
    VarianceSample = ObjectIds.AggregateFunction_VarianceSample,
    WorstQuality = ObjectIds.AggregateFunction_WorstQuality,
    WorstQuality2 = ObjectIds.AggregateFunction_WorstQuality2
}

export function addAggregateSupport(addressSpace: AddressSpace) {
    const aggregateConfigurationType = addressSpace.getNamespace(0).findObjectType("AggregateConfigurationType");

    /* istanbul ignore next */
    if (!aggregateConfigurationType) {
        throw new Error("addressSpace do not expose AggregateConfigurationType");
    }

    const aggregateFunctionType = addressSpace.getNamespace(0).findObjectType("AggregateFunctionType");

    /* istanbul ignore next */
    if (!aggregateFunctionType) {
        throw new Error("addressSpace do not expose AggregateFunctionType");
    }

    const serverObject = addressSpace.rootFolder.objects.getFolderElementByName("Server");

    /* istanbul ignore next */
    if (!serverObject) {
        throw new Error("addressSpace do not expose a ServerObject");
    }
    // xx serverObject.

    const serverCapabilities = serverObject.getChildByName("ServerCapabilities")! as UAServerCapabilities;

    // Let see if HistoryServer Capabilities object exists
    let historyServerCapabilities = serverCapabilities.getChildByName("HistoryServerCapabilities");

    /* istanbul ignore next */
    if (!historyServerCapabilities) {
        historyServerCapabilities = createHistoryServerCapabilities(addressSpace, serverCapabilities);
    }

    setHistoricalServerCapabilities(historyServerCapabilities, historicalCapabilitiesDefaultProperties);

    addAggregateFunctionSupport(addressSpace, AggregateFunction.Interpolative);
    addAggregateFunctionSupport(addressSpace, AggregateFunction.Minimum);
    addAggregateFunctionSupport(addressSpace, AggregateFunction.Maximum);

}

export function installAggregateConfigurationOptions(
  node: UAVariable,
  options: AggregateConfigurationOptionsEx
) {
    const nodePriv = node as any;
    const aggregateConfiguration = nodePriv.$historicalDataConfiguration.aggregateConfiguration;
    aggregateConfiguration.percentDataBad.setValueFromSource({ dataType: "Byte", value: options.percentDataBad });
    aggregateConfiguration.percentDataGood.setValueFromSource({ dataType: "Byte", value: options.percentDataGood });
    aggregateConfiguration.treatUncertainAsBad.setValueFromSource({
        dataType: "Boolean",
        value: options.treatUncertainAsBad
    });
    aggregateConfiguration.useSlopedExtrapolation.setValueFromSource({
        dataType: "Boolean",
        value: options.useSlopedExtrapolation
    });

    nodePriv.$historicalDataConfiguration.stepped.setValueFromSource({
        dataType: "Boolean",
        value: options.stepped
    });
}

export function getAggregateConfiguration(node: BaseNode): AggregateConfigurationOptionsEx {

    const nodePriv = node as any;

    /* istanbul ignore next */
    if (!nodePriv.$historicalDataConfiguration) { throw new Error("internal error"); }
    const aggregateConfiguration = nodePriv.$historicalDataConfiguration.aggregateConfiguration;

    // Beware ! Stepped value comes from Historical Configuration !
    const stepped = nodePriv.$historicalDataConfiguration.stepped.readValue().value.value;

    return {
        percentDataBad: aggregateConfiguration.percentDataBad.readValue().value.value,
        percentDataGood: aggregateConfiguration.percentDataGood.readValue().value.value,
        stepped,
        treatUncertainAsBad: aggregateConfiguration.treatUncertainAsBad.readValue().value.value,
        // xx stepped:                aggregateConfiguration.stepped.readValue().value,
        useSlopedExtrapolation: aggregateConfiguration.useSlopedExtrapolation.readValue().value.value
    };
}
