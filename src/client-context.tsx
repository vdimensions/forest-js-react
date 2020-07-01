import React, { useContext } from "react";
import { IForestClient, ForestHttpClient } from "@vdimensions/forest-js-frontend";

export const ForestClientContext = React.createContext<IForestClient>(ForestHttpClient.create(window.location));
export const useForestClient = () => useContext(ForestClientContext);