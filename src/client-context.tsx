import React, { useContext } from "react";
import { IForestClient, NoopClient } from "@vdimensions/forest-js-frontend";

export const ForestClientContext = React.createContext<IForestClient>(NoopClient);
export const useForestClient = () => useContext(ForestClientContext);