import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonText,
} from "@ionic/react";
import { useState } from "react";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const sendOtp = () => {
    if (phone.length === 10) {
      setShowOtp(true);
      alert("OTP Sent (Demo: 1234)");
    } else {
      alert("Enter valid 10 digit number");
    }
  };

  const verifyOtp = () => {
    if (otp === "1234") {
      alert("Login Successful");
    } else {
      alert("Wrong OTP");
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">

        <h2>Login with Phone</h2>

        {!showOtp ? (
          <>
            <IonInput
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onIonChange={(e) => setPhone(e.detail.value!)}
            />
            <IonButton expand="block" onClick={sendOtp}>
              Send OTP
            </IonButton>
          </>
        ) : (
          <>
            <IonInput
              type="number"
              placeholder="Enter OTP"
              value={otp}
              onIonChange={(e) => setOtp(e.detail.value!)}
            />
            <IonButton expand="block" onClick={verifyOtp}>
              Verify OTP
            </IonButton>
          </>
        )}

      </IonContent>
    </IonPage>
  );
};

export default Login;