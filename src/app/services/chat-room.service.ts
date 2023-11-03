import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { ChatRoomByUserDto } from '../models/dto/chatRoomByUserDto';
import { ChatRoom } from '../models/entities/chatRoom';
import { ListResponseModel } from '../models/listResponseModel';
import { BaseService } from '../utilities/baseService';

@Injectable({
  providedIn: 'root'
})
export class ChatRoomService extends BaseService<ChatRoom> {

  //socket
  private token: string;
  private socket: Socket;
  public chatRoomConnected$: BehaviorSubject<string> = new BehaviorSubject('');
  public chatRoomHandlePlayer$: BehaviorSubject<string> = new BehaviorSubject('');
  public chatRoomHandleMessage$: BehaviorSubject<string> = new BehaviorSubject('');
  public messageResponse$: BehaviorSubject<string> = new BehaviorSubject('');
  public playerResponse$: BehaviorSubject<string> = new BehaviorSubject('');
  constructor(private httpClient: HttpClient) {
    super(httpClient);
    this.name = "chat-rooms";
  }

  getRoomsByUserDto(): Observable<ListResponseModel<ChatRoomByUserDto>> {
    let newPath = environment.appurl + "chat-rooms/getroomsbyuserdto"
    return this.httpClient.get<ListResponseModel<ChatRoomByUserDto>>(newPath);
  }

  //socket
  public connectSocket() {
    this.token = localStorage.getItem('token');
    this.socket = io(environment.appurlSocketChatRoom, {
      auth: { token: this.token }
    });
    this.setupSocketListeners();
  }
  private setupSocketListeners() {
    this.socket.on('chatRoomConnected', (message: any): any => {
      this.chatRoomConnected$.next(message);
    });
    this.socket.on('chatRoomHandlePlayer', (message: any): any => {
      this.chatRoomHandlePlayer$.next(message);
    });
    this.socket.on('chatRoomHandleMessage', (message: any): any => {
      this.chatRoomHandleMessage$.next(message);
    });
    this.socket.on('messageResponse', (message: any): any => {
      this.messageResponse$.next(message);
    });
    this.socket.on('playerResponse', (message: any): any => {
      this.playerResponse$.next(message);
    });
  }

  public sendChatRoomConnected(arg: any) {
    this.socket.emit('chatRoomConnected', arg);
  }

  public getChatRoomConnected = () => {
    return this.chatRoomConnected$.asObservable();
  };

  public sendChatRoomHandlePlayer(arg: any) {
    this.socket.emit('chatRoomHandlePlayer', arg);
  }

  public getChatRoomHandlePlayer = () => {
    return this.chatRoomHandlePlayer$.asObservable();
  };

  public sendChatRoomHandleMessage(arg: any) {
    this.socket.emit('chatRoomHandleMessage', arg);
  }

  public getChatRoomHandleMessage = () => {
    return this.chatRoomHandleMessage$.asObservable();
  };

  public sendMessageResponse(arg: any) {
    this.socket.emit('messageResponse', arg);
  }

  public getMessageResponse = () => {
    return this.messageResponse$.asObservable();
  };

  public sendPlayerResponse(arg: any) {
    this.socket.emit('playerResponse', arg);
  }

  public getPlayerResponse = () => {
    return this.playerResponse$.asObservable();
  };
}