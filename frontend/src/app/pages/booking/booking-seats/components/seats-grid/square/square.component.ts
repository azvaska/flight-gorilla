import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
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
export class SquareComponent implements OnChanges {

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['class']) {
      this.squareStyle = this.getSquareStyle();
    }
  }

  private getSquareStyle(): string {
    if(this.class === SeatClass.UNAVAILABLE){
      return 'bg-transparent';
    } else if(this.class === SeatClass.OCCUPIED){
      return 'bg-red-600';
    } else {
      switch (this.class) {
        case 'economy':
          return 'bg-zinc-300';
        case 'business':
          return 'bg-zinc-400';
        case 'first':
          return 'bg-stone-700';
        default:
          return ''
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
