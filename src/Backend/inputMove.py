import speech_recognition as sr


def confirm_user_choice(move):
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print(f'Play {move} Say "Yes" to Confirm, "No" to try again')
        audio = recognizer.listen(source)
        try:
            text = recognizer.recognize_google(audio)
            if text == "Yes":
                return True
        except sr.UnknownValueError:
            print("Google Speech Recognition could not understand the audio")
            return None
        except sr.RequestError as e:
            print(f"Could not request results; {e}")
            return None


def transcribe_audio():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Say your chess move:")
        audio = recognizer.listen(source)

    try:
        text = recognizer.recognize_google(audio)
        if confirm_user_choice(text):
            return text
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand the audio")
        return None
    except sr.RequestError as e:
        print(f"Could not request results; {e}")
        return None
