import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgClass} from '@angular/common';
import { SeatClass } from '../seats-grid.component';
@Component({
  selector: 'app-square',
  imports: [
    NgClass
  ],
  templateUrl: './square.component.html',
  styleUrls: ['./square.component.css']
})
export class SquareComponent implements OnInit {

  SeatClass = SeatClass;

  @Input() row: number = -1;
  @Input() column: number = -1;

  @Input() isSelected = false;
  @Input() isHighlighted = false;
  @Input() class: SeatClass = SeatClass.ECONOMY;

  @Input() animateOccupied = true;
  @Output() selected = new EventEmitter<{ row: number, col: number, class: SeatClass.ECONOMY | SeatClass.BUSINESS | SeatClass.FIRST }>();
  @Output() selectedOccupied = new EventEmitter<{ row: number, col: number}>();

  squareStyle: string = '';

  ngOnInit() {
    console.log('reder');
    if(this.class === SeatClass.UNAVAILABLE){
      this.squareStyle = 'bg-transparent';
    } else if(this.class === SeatClass.OCCUPIED){
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
    if(this.class !== SeatClass.UNAVAILABLE){
      if(this.class !== SeatClass.OCCUPIED) {
        this.selected.emit({row: this.row, col: this.column, class: this.class });
      } else {
        this.shake = true;
        setTimeout(() => this.shake = false, 300);
        this.selectedOccupied.emit({row: this.row, col: this.column});
      }
    }
  }
}
