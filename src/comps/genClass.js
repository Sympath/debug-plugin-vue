import {eachObj} from '../../util';

export class GenButton {
    constructor(text,clickEvent,opts = {}){
        this.text = text;
        this.clickEvent = clickEvent;
        eachObj(opts,(key,val) => {
            this[key] = val
        })
    }
}