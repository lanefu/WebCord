import { app, dialog } from "electron";
import * as colors from "colors/safe";

/* Handles uncaughtException errors */

export default function uncaughtExceptionHandler(): void {
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', async (error:Error&NodeJS.ErrnoException) => {
        let wasReady = false;
        if(app.isReady()) wasReady = true;
        let stack = "", message = "", stackColor = "";
        const name = "UncaughtException: " + app.getName() + " threw '" + error.name + "'.";
        if (error.message !== "")
            message = "\n\n" + error.message;


        if (error.stack !== undefined) {
            stack = "\n" + error.stack
                .replace(error.name + ': ' + error.message, '');
            stackColor = stack;
            const stackLines = stack.split(/\r\n|\n|\r/);
            const stackProcessed: string[] = [], stackColorProcessed: string[] = [];
            for (const line of stackLines) {
                const regexAppPath = app.getAppPath().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (line.match(RegExp("at.*\\(" + regexAppPath + ".*\\).*", 'g'))) {
                    let modifiedLine = line;
                    const tsRule = line.match(/\(\/.*\.ts.*\)/);
                    if (tsRule)
                        modifiedLine = line.replace(tsRule[0].replace(new RegExp("\\((" + regexAppPath + "\\/).*\\)"), "$1"), "");
                    stackProcessed.push(modifiedLine);
                    stackColorProcessed.push(modifiedLine);
                } else {
                    stackColorProcessed.push(colors.gray(line));
                }
            }
            if (error.message !== "")
                stack = "\n\n" + stackProcessed.join('\n');
            else
                stack = stackProcessed.join('\n');
            stackColor = stackColorProcessed.join('\n');
        }
        if(!app.isReady()) await app.whenReady();
        if(wasReady) console.error('\n' + colors.red(colors.bold(name)) + colors.blue(message) + stackColor);
        dialog.showMessageBoxSync({
            title: name,
            message: error.message + stack,
            type: 'error'
        });

        let errCode: number;
        switch (error.name) {
            case "Error":
                if (error.errno||error.code||error.syscall||error.path)
                    errCode = 99;
                else
                    errCode = 101;
                break;
            case "TypeError":
                errCode = 102;
                break;
            case "SyntaxError":
                errCode = 103;
                break;
            case "RangeError":
                errCode = 104;
                break;
            case "EvalError":
                errCode = 105;
                break;
            case "RefferenceError":
                errCode = 106;
                break;
            case "URIError":
                errCode = 107;
                break;
            case "AggregateError":
                errCode = 108;
                break;
            default:
                errCode = 100;
        }
        console.error("\nApplication crashed (Error code: " + errCode + (error.errno ? ", ERRNO: " + error.errno : "") + ")\n");
        app.exit(errCode);
    });
}