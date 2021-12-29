import { useCallback } from "react";
import { ForestResponse, Command } from "@vdimensions/forest-js-frontend";
import { useForestClient } from "./client-context";
import { useHistory } from "react-router-dom";
import { useViewContext } from "./view";
import { ensureStartSlash } from "./path";
import { EMPTY_FOREST_RESPONSE, useForestSelectors } from "./store";

interface ForestReactCommand extends Command {
    invoke: (arg?: any) => void;
}
export type TForestReactCommand = ForestReactCommand;

export type ForestHooks = {
    useNavigate: { () : { (template: string) : void } },
    useCommand: { (command: string) : TForestReactCommand }
}


export const useNavigate = () => {
    const {useDispatch} = useForestSelectors();
    const dispach = useDispatch();
    const client = useForestClient();
    const {replace} = useHistory();
    return useCallback((template: string) => {
        client
            .navigate(template)
            .then(x => x as ForestResponse || EMPTY_FOREST_RESPONSE)
            .then(x => {
                replace(ensureStartSlash(x.path), x)
                return x;
            })
            .then(dispach);
    }, [client, dispach, replace]);
};

export const useCommand : (command: string) => TForestReactCommand = ((command) => {
    const {useDispatch, useViewState} = useForestSelectors();
    const dispach = useDispatch();
    const {push, replace} = useHistory();
    const client = useForestClient();
    const instanceId = useViewContext();
    const viewState = useViewState(instanceId);
    const cmd: Command|undefined = viewState?.commands[command];
    const path = cmd?.path || "";
    const invoke = useCallback((arg?: any) => {
        if (path) {
            client
                .navigate(path)
                .then(x => x as ForestResponse || EMPTY_FOREST_RESPONSE)
                .then(x => {
                    replace(ensureStartSlash(x.path), x)
                    return x;
                })
                .then(dispach);
        } else {
            client
                .invokeCommand(instanceId, command, arg)
                .then(x => x as ForestResponse || EMPTY_FOREST_RESPONSE)
                .then(x => {
                    push(ensureStartSlash(x.path), x);
                    return x;
                })
                .then(dispach);
        }
    }, [command, instanceId, path, client, dispach, push, replace]);
    return {
        invoke,
        name: command,
        path: path,
        description: cmd?.description || "",
        displayName: cmd?.displayName || "",
        tooltip: cmd?.tooltip || ""
    }
});