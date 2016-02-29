import * as utils from "../common/utils";
import { Note, Board } from "../common/model";
import { IBoardVM } from "../common/view-model";

export interface NoteStyle {
  top: string;
  left: string;
  display: string;
}

export class NoteVM {
  id: string;

  title = ko.observable<string>();
  content = ko.observable<string>();
  posX = ko.observable<number>(0);
  posY = ko.observable<number>(0);

  style = ko.computed<NoteStyle>(() => {
    var posX = this.posX();
    var posY = this.posY();
    return {
      top: posY ? `${posY}px` : "0",
      left: posX ? `${posX}px` : "0",
      display: posX != null && posY != null  ? "block" : "none"
    };
  });


  update(plain: Note) {
    this.title(plain.title);
    this.content(plain.content);
    this.posX(plain.posX);
    this.posY(plain.posY);

  }

  toPlain(): Note {
    var result = { };
    AddTruthyValue(result, "title", this.title());
    AddTruthyValue(result, "content", this.content());
    AddNumberValue(result, "posX", this.posX());
    AddNumberValue(result, "posY", this.posY());
    return result;
  }
}

function AddTruthyValue(destination: any, key: string, value: any) {
  if (value) {
    destination[key] = value;
  }
}

function AddNumberValue(destination: any, key: string, value: number) {
  if (Object.prototype.toString.call(value) == "[object Number]") {
    destination[key] = value;
  }
}

export class BoardVM implements IBoardVM {
  name = ko.observable<string>();
  color = ko.observable<string>();
  notes = ko.observableArray<NoteVM>([]);

  // TODO: consider to remove this index
  private notesById: Dictionary<NoteVM> = {};

  newNote = () => {
    var note = this.createNote();
    note.posX(0);
    note.posY(0);
    return note;
  };

  createNote(id: string = null) : NoteVM {
    id = id || utils.randomString();
    var note = new NoteVM();
    note.id = id;
    note.title( "Title here" );
    note.content("Content here");
    this.notesById[id] = note;
    this.notes.push(note);
    return note;
  }

  deleteNote(id: string) {
    var note = this.notesById[id];
    delete this.notesById[id];
    this.notes.remove(note);
  }

  update(plain: Board) {
    this.name(plain.name);
    this.color(plain.color);

    // TODO: update observeble array only a time

    var notes = plain.notes || {};
    for (var id in notes) {
      var noteVM = this.notesById[id];
      if (!noteVM) {
        noteVM = this.createNote(id);
      }
      noteVM.update(notes[id]);
    }
    for (var id in this.notesById) {
      if (!notes[id]) {
        this.deleteNote(id);
      }
    }
  }

  clearBoard() {
    this.notes.removeAll();
  }

  toPlain(): Board {
    var result = <Board>{ };
    AddTruthyValue(result, "name", this.name());
    AddTruthyValue(result, "color", this.color());
    var noteVMs = this.notes();
    if (noteVMs.length) {
      var notes = <Dictionary<Note>>{};
      for (var i in noteVMs) {
        var noteVM = noteVMs[i];
        notes[noteVM.id] = noteVM.toPlain();
      }
      result.notes = notes;
    }
    return result;
  }

  applyBindings(rootNode?: any) {
    ko.applyBindings(this, rootNode);
  }
}
