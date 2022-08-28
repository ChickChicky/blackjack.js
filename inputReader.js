const ansiRegex = new RegExp(['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)','(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'].join('|'),'g'); // https://github.com/chalk/ansi-regex/

const mod = function(a,b) {return ((a%b)+b) % b};
/**
 * @typedef inputOptions
 * @type {Object}
 * @property {string|()=>string} [mask] the replacement character to hide the response
 * @property {string|()=>string} [afterPrompt] the new prompt after the user has answered
 * @property {()=>void} [onAbort] function to call chen the input has been aborted
 * @property {'text'|'choices'} [type] the type of input
 * @property {Array<String>} [choices] the options to choose from when in choices mode
 * @property {string|()=>string} [cursor] the cursor to display before the chosen value in choices mode
 * @property {number|()=>number} [defaultIndex] the default cursor position in choices mode
 */
/** @type {inputOptions} */
let defaultOptions = {
    'mask': undefined,
    'afterPrompt': undefined,
    'onAbort': ()=>{process.exit()},
    'type': 'text',
    'choices': [],
    'cursor': '>',
    'defaultIndex': 0
}

/**
 * Prompts the user and reads the input
 * @param {string} prompt the prompt to show
 * @param {inputOptions} options optionnal arguments
 */
function input(prompt,options=defaultOptions) {
    return new Promise((resolve)=>{
        options = Object.assign(defaultOptions,options);
        // transforms each option in a callable value
        for (let optn of Object.keys(options)) {
            let opt = options[optn];
            if (typeof(opt) != 'function') {
                options[optn] = ()=>{ return opt};
            }
        }

        let previousmode = process.stdin.isRaw;
        process.stdin.setRawMode(true);

        if (options.type() == 'text') {
            process.stdin.ref();
            
            str = ""; ptr = 0;
            process.stdout.write(`\x1b[m\x1b[2K\x1b[1G${prompt}\x1b[m${str.replace(/./g, (v)=>{ return options.mask()??v })}`);

            let endCallback = ()=>{
                process.stdin.setRawMode(previousmode);
                process.stdout.write(`\x1b[m\x1b[2K\x1b[1G${options.afterPrompt()??prompt}\x1b[m${str.replace(/./g, (v)=>{ return options.mask()??v })}\n`);
                process.stdin.unref();
            }

            let textCallback = (chunk)=>{
                if (chunk == '\x03' || chunk == '\x04') { // ctrl+(C|D)
                    endCallback();
                    resolve(); options.onAbort(); return;
                } else
                if (chunk == '\x08' ) { // backspace
                    let sta = Array.from(str);
                    str = ( sta.slice(0,ptr-1).concat(sta.slice(ptr,)) ).join('');
                    ptr -= (ptr>0)? 1:0;
                } else
                if ((chunk[0] == 27) && (chunk!='\x1b')) { // escape sequence
                    if (chunk == '\x1b[3~') { // delete
                        let sta = Array.from(str);
                        str = ( sta.slice(0,ptr).concat(sta.slice(ptr+1,)) ).join('');
                    } else 
                    if (chunk == '\x1b[A') { // up arrow
                        
                    } else 
                    if (chunk == '\x1b[B') { // down arrow
                        
                    } else 
                    if (chunk == '\x1b[C') { // right arrow
                        ptr += (ptr<str.length)? 1:0;
                    } else 
                    if (chunk == '\x1b[D') { // left arrow
                        ptr -= (ptr>0)? 1:0;
                    } else 
                    if (chunk == '\x1b[1~') { // home
                        ptr = 0;
                    } else 
                    if (chunk == '\x1b[4~') { // end
                        ptr = str.length-1;
                    }
                } else 
                if (chunk == '\x1b') { // escape key
            
                }else 
                if (chunk == '\n') {
                    
                } else 
                if (chunk == '\r') { // carriage return (enter key)
                    endCallback();
                    resolve(str); return;
                } else { // any other character
                    let sta = Array.from(str);
                    str = ( sta.slice(0,ptr).concat(String(chunk)[0],sta.slice(ptr,)) ).join('');
                    ptr += 1;
                }
                process.stdout.write(`\x1b[m\x1b[2K\x1b[1G${prompt}\x1b[m${str.replace(/./g, (v)=>{ return options.mask()??v })}`);
                process.stdin.once('data',textCallback);
            }
            process.stdin.once('data', textCallback);
        }

        if (options.type() == 'choices') {
            process.stdin.ref();

            let endCallback = ()=>{
                process.stdin.setRawMode(previousmode);
                process.stdout.write(text()+`\n`); process.stdin.unref();
            }

            let index = mod(options.defaultIndex(),options.choices().length);
            let text = ()=>`\x1b[m\x1b[2K\x1b[1G${prompt}${options.choices().map((opt,i)=>{
                return '\n'+(index==i? options.cursor():' '.repeat(options.cursor().replace(ansiRegex,'').length))+' '+opt;
            }).join('')}`
            process.stdout.write(text()+`\x1b[${options.choices().length}A`);
            
            let choicesCallback = (chunk)=>{
                if (chunk == '\x03' || chunk == '\x04') { // ctrl+(C|D)
                    endCallback();
                    resolve(); options.onAbort(); return;
                } else
                if (chunk == '\x08' ) { // backspace
                    
                } else
                if ((chunk[0] == 27) && (chunk!='\x1b')) { // escape sequence
                    if (chunk == '\x1b[3~') { // delete
                        let sta = Array.from(str);
                        str = ( sta.slice(0,ptr).concat(sta.slice(ptr+1,)) ).join('');
                    } else 
                    if (chunk == '\x1b[A') { // up arrow
                        index = mod(index-1,options.choices().length);
                    } else 
                    if (chunk == '\x1b[B') { // down arrow
                        index = mod(index+1,options.choices().length);
                    } else 
                    if (chunk == '\x1b[C') { // right arrow
                        
                    } else 
                    if (chunk == '\x1b[D') { // left arrow
                        
                    } else 
                    if (chunk == '\x1b[1~') { // home
                        
                    } else 
                    if (chunk == '\x1b[4~') { // end
                        
                    }
                } else 
                if (chunk == '\x1b') { // escape key
            
                }else 
                if (chunk == '\n') {
                    
                } else 
                if (chunk == '\r') { // carriage return (enter key)
                    endCallback();
                    resolve(options.choices()[index]); return;
                } else { // any other character
                    let sta = Array.from(str);
                    str = ( sta.slice(0,ptr).concat(String(chunk)[0],sta.slice(ptr,)) ).join('');
                    ptr += 1;
                }
                process.stdout.write(text()+`\x1b[${options.choices().length}A`);
                process.stdin.once('data',choicesCallback);
            }
            process.stdin.once('data', choicesCallback);
        }
    });
}

module.exports = input;