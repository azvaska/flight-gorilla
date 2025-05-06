import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-square',
  imports: [
    NgClass
  ],
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.css']
})
export class SquareComponent implements OnInit {
  @Input() row: number = -1;
  @Input() column: number = -1;

  @Input() isSelected = false;
  @Input() class = '';
  @Input() selectedClass = '';
  @Input() available = true;
  @Input() occupied = false;

  @Input() animateOccupied = true;

  squareStyle: string = '';

  ngOnInit() {
    if(!this.available){
      this.squareStyle = 'bg-transparent';
    } else if(this.occupied){
      this.squareStyle = 'bg-red-600';
    } else {
      switch (this.class) {
        case 'economy':
          this.squareStyle = 'bg-zinc-300';
          break;
        case 'business':
          this.squareStyle = 'bg-zinc-400';
          break;
        case 'first':
          this.squareStyle = 'bg-stone-700';
          break;
        default:
          this.squareStyle = 'bg-pink-600';   // this is an error
          console.log("Error: class not found on seat " +
            this.row + ["A", "B", "C", "D", "E", "F"][this.column]);
      }
    }
  }

  shake = false;

  onclick(){
    if(this.available){
      if(!this.occupied) {
        this.selected.emit({row: this.row, col: this.column, class: this.class });
      } else {
        this.shake = true;
        setTimeout(() => this.shake = false, 300);
        this.selectedOccupied.emit({row: this.row, col: this.column});
      }
    }
  }

  @Output() selected = new EventEmitter<{ row: number, col: number, class: string }>();
  @Output() selectedOccupied = new EventEmitter<{ row: number, col: number}>();
}
