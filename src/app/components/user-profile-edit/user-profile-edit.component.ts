import { ToastrService } from 'ngx-toastr';
import { UserInfoService } from './../../services/user-info.service';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { UserService } from './../../services/user.service';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from 'src/app/models/entities/user';
import { AuthService } from 'src/app/services/auth.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserInfo } from 'src/app/models/entities/userInfo';
import { Messages } from 'src/app/constants/Messages';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-profile-edit',
  templateUrl: './user-profile-edit.component.html',
  styleUrls: ['./user-profile-edit.component.css']
})
export class UserProfileEditComponent implements OnInit, AfterViewInit {
  date: Date;
  minDate: Date;
  maxDate: Date;

  stateGenderOptions: any[];

  nickName: string;

  userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  userInfoSubject = new BehaviorSubject<UserInfo | null>(null);
  userInfo$ = this.userInfoSubject.asObservable();

  //user-info form
  userInfoForm: FormGroup;
  userInfoFormVisible: boolean = false;

  //user form
  userForm: FormGroup;
  userFormVisible: boolean = false;

  //form
  validatorRequired: string = "";
  lockedButtonClass: boolean = false;

  //menutItems
  menuItems: any;

  //userVerif
  userVerifVisible: boolean = false;
  isVerif2FAVisible: boolean = false;

  //towFa
  twoFAVisible: boolean = false;

  //proifle image file
  selectedFile: File | null = null;
  profileUrl: string = "https://source.unsplash.com/random/150x150";

  constructor(private userService: UserService,
    private userInfoService: UserInfoService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private toastrService: ToastrService) {

  }

  ngOnInit(): void {

    this.stateGenderOptions = [
      { label: 'Beyfendi', value: true },
      { label: 'Hanımefendi', value: false }
    ];

    // let today = new Date();
    // let month = today.getMonth();
    // let year = today.getFullYear();
    // let prevMonth = (month === 0) ? 11 : month - 1;
    // let prevYear = (prevMonth === 11) ? year - 100 : year;
    // let nextMonth = (month === 11) ? 0 : month + 1;
    // let nextYear = (nextMonth === 0) ? year + 20 : year;
    // this.minDate = new Date();
    // this.minDate.setMonth(prevMonth);
    // this.minDate.setFullYear(prevYear);
    // this.maxDate = new Date();
    // this.maxDate.setMonth(nextMonth);
    // this.maxDate.setFullYear(nextYear);

    this.route.params.subscribe((data: any) => {
      this.nickName = String(data['nickname']);
      this.getUserByNickName(this.nickName);
      this.getUserInfoByNickName(this.nickName);
    });

    this.userForm = this.formBuilder.group({
      firstName: ['', Validators.compose([Validators.required, Validators.nullValidator])],
      lastName: ['', Validators.compose([Validators.required, Validators.nullValidator])],
      nickName: ['', Validators.compose([Validators.required, Validators.nullValidator])],
    });

    this.userInfoForm = this.formBuilder.group({
      profileText: ['', Validators.compose([Validators.required, Validators.nullValidator])],
      gender: [true, Validators.compose([Validators.required, Validators.nullValidator])],
      birthdayDate: [new Date(), Validators.compose([Validators.required, Validators.nullValidator])],
    });

    this.getMenuItems();
  }

  ngAfterViewInit(): void {
    this.user$.subscribe(response => {
      if (response) {
        this.isVerif2FAVisible = (this.authService.getCurrentUserId() == response.id);
      }
    });
    this.user$.subscribe(response => {
      this.userForm.patchValue({
        firstName: response?.firstName,
        lastName: response?.lastName,
        nickName: response?.nickName
      })
    });
    this.userInfo$.subscribe(response => {
      this.userInfoForm.patchValue({
        profileText: response?.profileText,
        gender: response?.gender,
        birthdayDate: response?.birthdayDate
      })
      this.profileUrl = this.userInfoService.getProfileImage(response?.profileImagePath);
    });
  }

  getUserByNickName(nickName: string) {
    this.userService.getByNickName(nickName).subscribe(response => {
      if (response.success) {
        this.userSubject.next(response.data);
      }
    }, responseError => {
      if (responseError.error) {
        this.toastrService.error(Messages.error);
      }
    });
  }

  getUserInfoByNickName(nickName: string) {
    this.userInfoService.getByNickName(nickName).subscribe(response => {
      if (response.success) {
        this.userInfoSubject.next(response.data);
      }
    }, responseError => {
      if (responseError.error) {
        this.toastrService.error(Messages.error);
      }
    });
  }

  updateUser() {
    let userFormObject: any = Object.assign({}, this.userForm.value);
    let user: User = this.userSubject.getValue();
    user.firstName = userFormObject.firstName;
    user.lastName = userFormObject.lastName;
    user.nickName = userFormObject.nickName;
    this.userService.update(user).subscribe(response => {
      if (response.success) {
        this.toastrService.success(Messages.success);
      }
    }, responseError => {
      if (responseError.error) {
        this.toastrService.error(Messages.error);
      }
    })
  }

  updateUserInfo() {
    let userInfoFormObject: any = Object.assign({}, this.userInfoForm.value);
    let userInfo: UserInfo = this.userInfoSubject.getValue();

    userInfo.profileText = userInfoFormObject.profileText;
    userInfo.gender = userInfoFormObject.gender;
    userInfo.birthdayDate = userInfoFormObject.birthdayDate;
    this.userInfoService.update(userInfo).subscribe(response => {
      if (response.success) {
        this.toastrService.success(Messages.success);
      }
    }, responseError => {
      if (responseError.error) {
        this.toastrService.error(Messages.error);
      }
    })
  }

  submitUpdateUser() {
    if (!this.userForm.valid)
      return;
    this.updateUser();
  }

  submitUpdateUserInfo() {
    if (!this.userInfoForm.valid)
      return;
    this.updateUserInfo();
  }

  getMenuItems() {
    this.menuItems = [
      {
        label: 'Kullanıcı',
        icon: 'pi pi-fw pi-user',
        items: [
          {
            label: 'Genel Bilgiler',
            icon: 'pi pi-fw pi-user-plus',
            command: () => this.visibleUser(),
          },
          {
            label: 'Tanımlamlar',
            icon: 'pi pi-fw pi-user-minus',
            command: () => this.visibleUserInfo()
          },
        ]
      },
      {
        label: 'Hesap',
        icon: 'pi pi-fw pi-user',
        items: [
          {
            label: 'Onay',
            icon: 'pi pi-fw pi-user-plus',
            command: () => this.visibleUserVerif()
          },
          {
            label: 'Doğrulama',
            icon: 'pi pi-fw pi-user-minus'
          },
        ]
      },
      {
        label: 'Güvenlik',
        icon: 'pi pi-fw pi-user',
        items: [
          {
            label: 'İki Adımlı Google Doğrulama',
            icon: 'pi pi-fw pi-user-plus',
            command: () => this.visibleTwoFA()
          },
          {
            label: 'İki Adımlı E-Posta Doğrulama',
            icon: 'pi pi-fw pi-user-minus'
          },
          {
            label: 'İki Adımlı Telefon Doğrulama',
            icon: 'pi pi-fw pi-user-minus'
          },
        ]
      },
      {
        label: 'Olaylar',
        icon: 'pi pi-fw pi-calendar',
        items: [
          {
            label: 'Edit',
            icon: 'pi pi-fw pi-pencil',
            items: [
              {
                label: 'Save',
                icon: 'pi pi-fw pi-calendar-plus'
              },
              {
                label: 'Delete',
                icon: 'pi pi-fw pi-calendar-minus'
              }
            ]
          },
          {
            label: 'Archieve',
            icon: 'pi pi-fw pi-calendar-times',
            items: [
              {
                label: 'Remove',
                icon: 'pi pi-fw pi-calendar-minus'
              }
            ]
          }
        ]
      }
    ];
  }

  twoFA() {

  }

  updateUserProfile() {
    this.userInfoService.gets().subscribe(response => {
      if (response.success) {
        alert("ok");
      }
    })
  }

  visibleUser() {
    this.userFormVisible = !this.userFormVisible;
    this.userInfoFormVisible = false;
    this.twoFAVisible = false;
    this.userVerifVisible = false;
    this.getUserByNickName(this.nickName);
  }


  visibleUserInfo() {
    this.userInfoFormVisible = !this.userInfoFormVisible;
    this.userFormVisible = false;
    this.twoFAVisible = false;
    this.userVerifVisible = false;
    this.getUserInfoByNickName(this.nickName);
  }

  visibleTwoFA() {
    this.twoFAVisible = !this.twoFAVisible;
    this.userInfoFormVisible = false;
    this.userFormVisible = false;
    this.userVerifVisible = false;
  }

  visibleUserVerif() {
    this.userVerifVisible = !this.userVerifVisible;
    this.userInfoFormVisible = false;
    this.userFormVisible = false;
    this.twoFAVisible = false;
  }

  //profile image
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    this.uploadFile();
  }

  uploadFile(): void {
    if (this.selectedFile) {
      this.userInfoService.uploadProfileImage(this.nickName, this.selectedFile).subscribe(
        (response) => {
          this.toastrService.success(Messages.updloadFileSuccess, Messages.success);
        },
        (error) => {
          this.toastrService.error(Messages.updloadFileError, Messages.error);
        }
      );
    } else {
      this.toastrService.warning(Messages.notSelectFile, Messages.warn);
    }
  }
}
