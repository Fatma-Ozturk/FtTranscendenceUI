import { BaseService } from 'src/app/utilities/baseService';
import { Injectable } from '@angular/core';
import { GameHistory } from '../models/entities/gameHistory';
import { HttpClient } from '@angular/common/http';
import { ListResponseModel } from '../models/listResponseModel';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameHistoryService extends BaseService<GameHistory>{

  constructor(private httpClient: HttpClient) {
    super(httpClient);
    this.name = "game-histories";
  }

  public getByUserId(userId: number) {
    return this.httpClient.get<ListResponseModel<GameHistory>>(environment.appurl + "game-histories/getbyuserid?userId=" + userId);
  }
}
