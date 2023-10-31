import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { ChatRoomUserService } from 'src/app/services/chat-room-user.service';
import { ChatRoomUser } from 'src/app/models/entities/chatRoomUser';
import { Component, ElementRef, HostListener, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AvatarObj } from 'src/app/models/entities/avatarObj';
import { StructureObj } from 'src/app/models/entities/structureObj';
import { AvatarService } from 'src/app/services/avatar.service';
import { findCllsn } from 'src/app/utilities/chat/findCllsn';
import { RandomNumber } from 'src/app/utilities/randomNumber';
import { ChatRoomUserByUserDto } from 'src/app/models/dto/chatRoomUserByUserDto';
import { ChatRoomService } from 'src/app/services/chat-room.service';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent {
  chatMessageForm: FormGroup;
  chatRoomAccessId: string = "";
  isArrowUpPressed: boolean = false;
  isArrowDownPressed: boolean = false;
  isChatLogActive: boolean = false;

  @ViewChild('myCanvas')
  canvas: ElementRef<HTMLCanvasElement>;
  context: CanvasRenderingContext2D;

  w: number;
  h: number;

  img: HTMLImageElement;
  fountainStructure: StructureObj;
  npcs: any[] = [];//içinde sadece npcler var
  worldObjs: any[] = [];//içinde npc, player ve çeşme var

  player: any;
  playerArray: any[] = [];
  chatRoomUsersByUserDto: ChatRoomUserByUserDto[] = [];

  messages: { text: string, sender: string }[] = []; // Mesajları depolayacak dizi
  newMessage: string = ''; // Kullanıcının girdiği yeni mesaj

  screenHeight: number;
  screenWidth: number;

  constructor(
    private avatarService: AvatarService,
    private chatRoomUserService: ChatRoomUserService,
    private formBuilder: FormBuilder,
    private chatRoomService: ChatRoomService,
    private authService: AuthService,
    private el: ElementRef,
    private route: ActivatedRoute,
    private router: Router) {

  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const accessId = params.get('accessId');
      this.chatRoomAccessId = accessId; //accesIdControlü yap
    });

    this.createChatMessageForm();
  }


  createChatMessageForm() {
    this.chatMessageForm = this.formBuilder.group({
      message: ["", Validators.compose([Validators.required, Validators.nullValidator, Validators.minLength(0), Validators.maxLength(50)])],
    })
  }

  ngAfterViewInit(): void {
    this.getScreenSize();
    this.canvas.nativeElement.height = this.screenHeight - 200;
    this.canvas.nativeElement.width = this.screenWidth - 100;
    this.context = this.canvas.nativeElement.getContext('2d');
    this.w = this.canvas.nativeElement.width;
    this.h = this.canvas.nativeElement.height;

    //çeşme için nesne oluşturuyoruz.
    this.img = new Image();
    this.img.src = "https://i.ibb.co/GTsDmJF/fountain.png";
    this.fountainStructure = new StructureObj(300, 200, (this.w / 2) - 150, 100, 70, this.img, true, 12);
    this.getChatRoomUserByUserDto(() => {
      this.createUsers();
      this.createChatObject()
      this.runAI();
      this.runDisplay();
      this.chatRoomService.connectSocket();
      let response: any = { "data": this.chatRoomAccessId, "messages": "accessId", "success": true };
      this.chatRoomService.sendChatRoomConnected(response);
    });
  }

  createChatObject() {
    this.createNPCs();
    //ortamdaki objeleri worldObjs içinde topluyoruz.
    this.worldObjs[0] = this.player;
    for (var sn in this.npcs) {
      const numericSn = +sn + 1;
      this.worldObjs[numericSn] = this.npcs[numericSn - 1];
    }
    this.worldObjs[this.worldObjs.length] = this.fountainStructure;
    for (let index = 0; index < this.playerArray.length; index++) {
      this.worldObjs[this.worldObjs.length + index] = this.playerArray[index];
    }
  }

  createUsers() {
    let currentUserId: number = this.authService.getCurrentUserId();
    let counter: number;

    counter = 0;
    for (let index = 0; index < this.chatRoomUsersByUserDto.length; index++) {
      if (currentUserId != this.chatRoomUsersByUserDto[index].userId) {
        this.playerArray[counter] = new AvatarObj(this.chatRoomUsersByUserDto[index].nickName, 1, 0, 30, 60, 3, 28, 2, this.canvas.nativeElement.width / 2 - index * 30, this.canvas.nativeElement.height * 0.8 - index * 10, 0);
        counter++;
      }
      else {
        this.player = new AvatarObj(this.chatRoomUsersByUserDto[index].nickName, 1, 0, 30, 60, 3, 28, 2, this.canvas.nativeElement.width / 2 - 15, this.canvas.nativeElement.height * 0.8 - 54, 0);
      }
    }
  }

  sendMessage() {
    // Kullanıcının girdiği metni mesajlar dizisine ekleyin
    const newMessage = { text: this.newMessage, sender: this.player.name };
    this.messages.push(newMessage);

    // Kullanıcının girdiği metni temizleyin
    this.newMessage = '';
  }

  getChatRoomUserByUserDto(callback: () => void) {
    this.chatRoomUserService.getByAccessId(this.chatRoomAccessId).subscribe(response => {
      if (response.success) {
        this.chatRoomUsersByUserDto = response.data;
        callback();
      }
    })
  }

  createNPCs() {
    //1->female 0->male
    const NameObj = (name: string, gender: number) => ({
      name: name,
      gender: gender
    }),

      npcNames = [
        NameObj("Alice", 1),
        NameObj("Jack", 0),
        NameObj("Jill", 1)
      ],

      avatarW = 30,
      avatarH = 60;

    for (const npcn in npcNames) {
      let chooseSkin = RandomNumber(0, 3),
        placeX = RandomNumber(0, this.w - avatarW),
        placeY = RandomNumber(avatarH, this.h - 54 - avatarH);

      this.npcs[npcn] = new AvatarObj(npcNames[npcn].name, npcNames[npcn].gender, chooseSkin,
        avatarW, avatarH, 3, 28, 2, placeX, placeY, 8);

      if (findCllsn(this.npcs[npcn], this.worldObjs)) {
        this.npcs[npcn].x = this.player.x;
        this.npcs[npcn].y = this.player.y;
      }
      //bu if'i silersem npcler çeşmenin üzerinde duruyor. Silme!
    }
  }

  runAI() {
    for (var ai in this.npcs) {
      this.avatarService.npcAI(this.npcs[ai]);
    }
    setTimeout(() => {
      this.runAI(); // runAI fonksiyonunu tekrar çağırır
    }, 400);
  }


  drawStructure(strctr: StructureObj) {
    if (strctr.img === null) {
      this.context.fillStyle = "#aaa";
      this.context.fillRect(strctr.x, strctr.y, strctr.w, strctr.h);
    } else if (strctr.isAnim) {
      //buraya giriyor
      this.context.drawImage(strctr.img, strctr.w * (strctr.curFrame - 1), 0, strctr.w, strctr.h, strctr.x, strctr.y - strctr.backArea, strctr.w, strctr.h);
      ++strctr.curFrame;
      if (strctr.curFrame > strctr.frames) {
        strctr.curFrame = 1;
      }
    } else {
      this.context.drawImage(strctr.img, strctr.x, strctr.y, strctr.w, strctr.h);
    }
  }

  runDisplay = () => {

    this.context.clearRect(0, 0, this.w, this.h);

    var imgG: HTMLImageElement = new Image();
    imgG.src = "https://i.ibb.co/TqMC0Dp/grass.png";

    let ground = this.context.createPattern(imgG, 'repeat');
    let pathW = 50,
      path = this.context.createLinearGradient(this.w / 2 - pathW / 2, 0, this.w / 2 + pathW / 2, 0);

    path.addColorStop(0.05, "#863");
    path.addColorStop(0.05, "#974");
    path.addColorStop(0.95, "#974");
    path.addColorStop(0.95, "#753");

    this.context.fillStyle = ground;
    this.context.fillRect(0, 0, this.w, this.h);

    this.context.fillStyle = path;
    this.context.fillRect(this.w / 2 - pathW / 2, 220, pathW, this.h - 200);

    // sort avatars and structures ascending by Y position so that they each arent standing on top of another
    this.worldObjs.sort(function (a, b) {
      return a.y - b.y;
    });

    // render everything
    for (var wo in this.worldObjs) {
      // to determine if avatar, test for name
      if (this.worldObjs[wo].name) {
        this.avatarService.moveAvatar(this.worldObjs[wo], this.w, this.h, this.worldObjs);
        this.avatarService.drawAvatar(this.worldObjs[wo], this.context);
      } else {
        this.drawStructure(this.worldObjs[wo]);
      }
    }
    setTimeout(() => {
      this.runDisplay();
    }, 1000 / 60);
  }

  //message

  sendMessageClick() {
    if (this.chatMessageForm.valid) {
      let chatMessageForm: any = Object.assign({}, this.chatMessageForm.value)
      let messageText = chatMessageForm.message;
      this.player.updateLastMessage(messageText);
      this.newMessage = messageText;
      this.sendMessage();
      this.chatMessageForm.setValue({ "message": "" });
      let data = { "messages": this.messages, "accessId": this.chatRoomAccessId }
      let response = { message: 'Message Text', data: data };
      this.chatRoomService.sendChatRoomHandleMessage(response);

      this.chatRoomService.getMessageResponse().subscribe((response: any) => {
        console.log("messageResponse ", response.messages);
        this.newMessage = response.messages;
        this.sendMessage();
      })
    }
  }

  toggleChatLog() {
    this.isChatLogActive = !this.isChatLogActive;
  }


  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      this.isArrowUpPressed = true;
      console.log("arrow up");
    } else if (event.key === 'ArrowDown') {
      this.isArrowDownPressed = true;
      console.log("arrow down");
    }
    this.avatarService.control(this.player, event);
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') {
      this.isArrowUpPressed = false;
    } else if (event.key === 'ArrowDown') {
      this.isArrowDownPressed = false;
    }
    this.avatarService.stopControl(this.player);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.getScreenSize();
  }

  getScreenSize() {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
  }
}
