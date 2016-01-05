module ViewModel {
  export interface NoteStyle {
    top: string;
    left: string;
    display: string;
  }

  export class Note {
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


    update(plain: Model.Note) {
      this.title(plain.title);
      this.content(plain.content);
      this.posX(plain.posX);
      this.posY(plain.posY);

    }

    toPlain(): Model.Note {
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

  export class Board {
    name = ko.observable<string>();
    color = ko.observable<string>();
    notes = ko.observableArray<Note>([]);

    // TODO: consider to remove this index
    private notesById: Dictionary<Note> = {};

    newNote = () => {
      var note = this.createNote();
      note.posX(0);
      note.posY(0);
      return note;
    };

    createNote(id: string = null) : Note {
      id = id || Utils.randomString();
      var note = new Note();
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

    update(plain: Model.Board) {
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

    toPlain(): Model.Board {
      var result = <Model.Board>{ };
      AddTruthyValue(result, "name", this.name());
      AddTruthyValue(result, "color", this.color());
      var noteVMs = this.notes();
      if (noteVMs.length) {
        var notes = <Dictionary<Model.Note>>{};
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
}
