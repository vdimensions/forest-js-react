import React, { useContext } from "react";
import { View } from "./view";
import { RegionMap } from "@vdimensions/forest-js-frontend";
import { useForestSelectors } from "./store";

export const RegionContext = React.createContext<RegionMap>({});
const useRegionContext = () => useContext(RegionContext);

type RegionProps = {
    name: string
}
export const Region = React.memo((props: RegionProps) => {
    const regionContextData = useRegionContext();
    const selectors = useForestSelectors();
    const regionData = regionContextData[props.name]||[];
    return (
        <React.Fragment>
            {regionData.map(x => <View key={x} instanceId={x} selectors={selectors} />)}
        </React.Fragment>
    );
});