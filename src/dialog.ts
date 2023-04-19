import { Entity, engine } from "@dcl/sdk/ecs";
import { npcDataComponent } from "./npc";
import { IsTypingDialog } from "./components";
import { handleDialogTyping } from "./systems";
import { Dialog, NPCState } from "./types";

export const npcDialogComponent: Map<Entity, any> = new Map()
export const npcDialogTypingSystems: Map<Entity, any> = new Map()

export enum ConfirmMode {
    Confirm = 0,
    Cancel = 1,
    Next = 2,
    Button3 = 3,
    Button4 = 4
  }

export function addDialog(npc:Entity){
    npcDialogComponent.set(npc, {
        typing:true,
        visible:false,
        visibleText:"",
        visibleChars:0,
        fullText:"",
        timer:0,
        speed:30,
        script:[],
        index:0
    })
}

export function getText(npc:Entity){
    return npcDialogComponent.get(npc).visibleText
}

export function displayDialog(npc:Entity){
    return npcDialogComponent.get(npc).visible
}

export function closeDialog(npc:Entity){
    let dialogData = npcDialogComponent.get(npc)
    dialogData.visible = false
    dialogData.typing = false
    dialogData.visibleText = ""
    dialogData.visibleChars = 0
    dialogData.fullText = ""
    dialogData.timer = 0
    dialogData.index = 0
    dialogData.script = []

    if(npcDialogTypingSystems.has(npc)){
        engine.removeSystem(npcDialogTypingSystems.get(npc))
    }
}

export function talk(npc:Entity, dialog:Dialog[], startIndex?:number, duration?:number){

    npcDataComponent.get(npc).state = NPCState.TALKING
    openDialog(npc,dialog, startIndex ? startIndex : 0)
}

function openDialog(npc:Entity, dialog:any[], startIndex:number){
    let dialogData = npcDialogComponent.get(npc)
    dialogData.script = addLineBreaks(dialog)
    dialogData.index = startIndex
    
    let currentText: Dialog = dialog[startIndex] ? dialog[startIndex] : { text: '' }

    //TODO
    //integrate sound to dialog

    // if (currentText.audio) {
    //   this.soundEnt.addComponentOrReplace(new AudioSource(new AudioClip(currentText.audio)))
    //   this.soundEnt.getComponent(AudioSource).volume = 0.5
    //   this.soundEnt.getComponent(AudioSource).playOnce()
    // } else if (this.defaultSound) {
    //   this.soundEnt.addComponentOrReplace(new AudioSource(new AudioClip(this.defaultSound)))
    //   this.soundEnt.getComponent(AudioSource).playOnce()
    // }


    //TODO
    //set portrait
    //set image on the right
    //set text
    //global button actions

    beginTyping(npc)
}

function beginTyping(npc:Entity){
    let dialogData = npcDialogComponent.get(npc)
    dialogData.fullText = dialogData.script[dialogData.index].text
    dialogData.visible = true
    dialogData.typing = true
    dialogData.visibleText = ""
    dialogData.visibleChars = 0
    dialogData.timer = 0
    dialogData.openTime = Math.floor(Date.now())
    
    if(dialogData.script[dialogData.index].hasOwnProperty("typeSpeed")){
        dialogData.speed = dialogData.script[dialogData.index].typeSpeed
    }
    else{
        dialogData.speed = 30
    }

    if(dialogData.speed <= 0){
        rushText(npc)
    }
    else{
        if(!IsTypingDialog.has(npc)){
            IsTypingDialog.create(npc)
        }
    
        if(!npcDialogTypingSystems.has(npc)){
            npcDialogTypingSystems.set(npc,engine.addSystem(handleDialogTyping))
        }
    }
}

function addLineBreaks(dialog:Dialog[]){
    let cleaned:Dialog[] = []
    dialog.forEach((d)=>{
        d.text = lineBreak(d.text, 50)
        cleaned.push(d)
    })
    return cleaned
}

function lineBreak(text: string, maxLineLength: number): string {
    const words = text.split(' ');
    let currentLine = '';
    const lines = [];
  
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLineLength) {
        currentLine += `${word} `;
      } else {
        lines.push(currentLine.trim());
        currentLine = `${word} `;
      }
    }
    lines.push(currentLine.trim());
    return lines.join('\n');
}

export function handleDialogClick(npc:Entity){
    if(npcDialogComponent.has(npc)){
        let dialogData = npcDialogComponent.get(npc)
        if(!dialogData.visible || (Math.floor(Date.now()) - dialogData.openTime  < 100)) return
        
        if(dialogData.typing){
            rushText(npc)
        }
        else{
            confirmText(npc, ConfirmMode.Next)
        }
    }
}

function rushText(npc:Entity){
    let dialogData = npcDialogComponent.get(npc)
    dialogData.typing = false
    dialogData.timer = 0
    dialogData.visibleChars = dialogData.fullText.length
    dialogData.visibleText = dialogData.fullText
    engine.removeSystem(npcDialogTypingSystems.get(npc))
}
function confirmText(npc:Entity, mode: ConfirmMode): void {
    let dialogData = npcDialogComponent.get(npc)
    dialogData.openTime = Math.floor(Date.now())

    let currentText = dialogData.script[dialogData.index]
    // Update active text
    if (mode == ConfirmMode.Next) {
        if (!currentText.isQuestion) {
            if (currentText.triggeredByNext) {
            currentText.triggeredByNext()
            }
            if (currentText.isEndOfDialog) {
            closeDialog(npc)
            return
            }
            dialogData.index++
        }

        beginTyping(npc)
    }
}