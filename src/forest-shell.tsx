import React, { FC, memo } from "react";
import Region, { RegionContext } from "./region";
import { useForestSelectors } from "./store";

const Shell: FC = memo(() => {
    const {useRootHierarchy} = useForestSelectors();
    const hierarchy = useRootHierarchy();
    return (
        <RegionContext.Provider value={hierarchy}>
            <Region name="" />
        </RegionContext.Provider>
    );
});

export default Shell;