import React, { useState, Attributes, useContext, useEffect } from 'react';
import * as Immutable from "immutable";
import * as Forest from "@vdimensions/forest-js";
import { BrowserRouter as Router, Switch } from "react-router-dom";
import { Route, useLocation, useHistory } from 'react-router';
import { History, Location } from 'history';

const AppStateContext = React.createContext(Forest.AppContext.empty());
const useAppContext = () => useContext(AppStateContext);

const RegionContext = React.createContext(Immutable.Map<string, string[]>());
const useRegionContext = () => useContext(RegionContext);


/** Component Registry Store Begin *******************************************/
interface FC<T = {}> extends React.FC<Forest.ViewContext<T>> { };
interface InternalFC<T = {}> extends React.FC<Forest.ViewState<T>> { };

const componentRegistry = (function() {
    let data = Immutable.Map<string, InternalFC>();
    return {
        get: (name: string) => data.get(name),
        set: (name: string, view: InternalFC<any>) => {
            data = data.set(name, view);
        }
    }
})();
/** Component Registry Store Begin *******************************************/

const renderViewStateItem = (x : Forest.ViewState<any> | null | undefined) => {
    let y = x && componentRegistry.get(x.name);
    if (x && y) {
        // generate an unique key for the created react element, as well as use the forest view name for meaningful representation in react dom.
        let enahncedInstance : Attributes & Forest.ViewState<any> = {key: x.name + " #" + x.instanceId, ...x};
        return React.createElement(y, enahncedInstance);
    } else if (x) {
        // TODO: error
        return (<React.Fragment key={(x && x.name && x.instanceId) ? x.name + " #" + x.instanceId : "null"}/>);
    }
};

const renderRegionContents = (appContext : Forest.AppContext, viewKeys: string[] | undefined) => {
    if (!viewKeys) {
        return (<></>);
    }
    const rootViews = viewKeys.map(k => appContext.state.instances.get(k));
    const items = rootViews.map(k => renderViewStateItem(k));
    return (
        <React.Fragment>
            {items}
        </React.Fragment>
    );
};

const deepEqual : (a: any, b: any) => boolean = require('deep-equal');
const defaultShouldComponentUpdate = <T extends {}> (prevProps: T, nextProps: T) => !deepEqual(prevProps, nextProps);

const ForestMemo = (component: React.FC<any>) => React.memo(component, (a, b) => !defaultShouldComponentUpdate(a, b));

export const RegisterComponent = <T extends {}>(name: string, component: FC<T>) => {
    const ForestComponent: InternalFC<T> & { whyDidYouRender: boolean } = (vs: Forest.ViewState<T>) => {
        const appContext = useAppContext();
        const ctx : Forest.ViewContext<T> = new Forest.ViewContext<T>(
            vs, 
            (name: string, arg?: any) => {
                appContext.engine.invokeCommand(vs.instanceId, name, arg);
            });
        const regions = Immutable.Map<string, string[]>(vs.regions);
        console.log("Rendering view: " + ctx.name + " #" + ctx.instanceId);
        return (
            <RegionContext.Provider value={regions}>
                {component(ctx)}
            </RegionContext.Provider>
        );
    };
    ForestComponent.whyDidYouRender = true;
    
    const ForestComponentMemo : any = ForestMemo(ForestComponent);
    ForestComponentMemo.whyDidYouRender = ForestComponent.whyDidYouRender;
    componentRegistry.set(name, ForestComponentMemo);
    return ForestComponentMemo;
};

type RegionContentData = {
    name: string
}
const RegionComponent : React.FC<RegionContentData> & { whyDidYouRender : boolean } = (props: RegionContentData) => {
    const appContext = useAppContext();
    const regionContext: Immutable.Map<string, string[]> = useRegionContext();
    console.log("Rendering region: " + props.name);
    return renderRegionContents(appContext, regionContext.get(props.name));
};
RegionComponent.whyDidYouRender = true;
export const Region = React.memo(RegionComponent, defaultShouldComponentUpdate);

export type ForestConfig = {
    initialTemplate: string,
    client: Forest.IForestClient
}

const syncContext = (appContext: Forest.AppContext, history: History<any>) => {
    if (appContext.state.template) {
        history.push(appContext.state.template, appContext.state);
    }
}

const useNavigation = (config: ForestConfig) => {
    
    const [appContext, setContext] = useState(Forest.AppContext.empty());
    let location: Location<any> = useLocation();
    let history: History<any> = useHistory();
    useEffect(() => {
        if (!location) {
            return;
        }
        let navTemplate = (location.pathname && location.pathname.substr(1).replace(/\/$/, "")) || config.initialTemplate;
        if (location.state && location.state.template === navTemplate && appContext.state.instances.count()) {
            // this is application-triggered redirect, do not do anything
            console.log("Skip navigation");
        } else {
            const engine : Forest.ForestEngine = Forest.CreateEngine(config.client);
            engine.subscribe(appContext => {
                syncContext(appContext, history);
                setContext(appContext);
            });
            engine.navigate(navTemplate).then(appContext => {
                if (appContext) {
                    syncContext(appContext, history);
                }
            });
            console.log("Rendering template: " + navTemplate);
        }
    },
    [location, history, config, appContext]);
    return appContext;
};

const Template : React.FC<ForestConfig> & { whyDidYouRender : boolean } = (config) => {
    let appContext = useNavigation(config);
    return (
        <AppStateContext.Provider value={appContext}>
            {renderRegionContents(appContext, (appContext.state.hierarchy.get("") || []))}
        </AppStateContext.Provider>
    );
};
Template.whyDidYouRender = true;

export const Shell : React.FC<ForestConfig> = (config) => {
    return (
        <Router>
            <Switch>
                <Route path="*">
                    <Template {...config} />
                </Route>
            </Switch>
        </Router>
    );
};
//export const Shell = Template;