import { LogoutButton } from "./logout-button";
import { MyInfoForm } from "./my-info-form";
import { PasswordChangeForm } from "./password-change-form";

/**
 * 마이: 내 정보 수정, 비밀번호 변경(별도 영역), 로그아웃
 */
export default function MyPage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-semibold">마이</h1>

      <MyInfoForm />

      <PasswordChangeForm />

      <LogoutButton />
    </div>
  );
}
