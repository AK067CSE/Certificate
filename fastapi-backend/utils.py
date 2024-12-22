import requests
from PIL import Image
from io import BytesIO
import uuid
import os
import cv2


def save_image_from_url(url, output_folder_name):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            image = Image.open(BytesIO(response.content))
            output_folder_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), output_folder_name
            )
            if not os.path.exists(output_folder_path):
                os.makedirs(
                    output_folder_path
                )  # Create the directory if it doesn't exist
            file_name = str(uuid.uuid4()) + ".jpg"  # Create a random file name
            file_path = os.path.join(output_folder_path, file_name)
            image.save(file_path)
            print(f"Image saved as {file_path}")
        else:
            print("Failed to download the image.")
    except Exception as e:
        print(f"An error occurred: {str(e)}")


def insert_info_to_image(base_certificate_image_path, full_name, date, logo_path):
    try:
        # Manipulate the saved image with OpenCV
        img_cv2 = cv2.imread(base_certificate_image_path)
        print(img_cv2.shape)
        # cv2.imshow('Image',img_cv2)
        # cv2.waitKey(0)
        # cv2.destroyAllWindows()

        # Add full name and date
        cv2.putText(
            img_cv2, full_name, (300, 500), cv2.FONT_HERSHEY_DUPLEX, 1, (0, 0, 0), 2
        )
        cv2.putText(
            img_cv2, date, (610, 460), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (0, 0, 0), 2
        )

        # # Add logo
        logo = cv2.imread(logo_path)
        logo = cv2.resize(logo, (100, 100))  # Resize the logo as needed

        img_cv2[695:795, 465:565] = logo
        file_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            f"certificates/certificate-{full_name.replace(' ','_').lower()}.jpg",
        )

        # # Save the manipulated image
        cv2.imwrite(file_path, img_cv2)

    except Exception as e:
        print(f"An error occurred: {str(e)}")


# Example usage:
if __name__ == "__main__":
    # image_url = 'some_url'
    # output_folder_name = 'certificate_base_image_variations'
    # save_image_from_url(image_url, output_folder_name)

    base_certificate_image_folder_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "certificate_base_image_variations"
    )
    base_certificate_image_file_path = os.path.join(
        base_certificate_image_folder_path, "aaf5316e-981f-4ec2-b301-beed6afdc20c.jpg"
    )
    logo_image_file_path = os.path.join(
        base_certificate_image_folder_path, "10academy-logo.png"
    )

    # # Manipulate the saved image with OpenCV
    insert_info_to_image(
        base_certificate_image_path=base_certificate_image_file_path,
        full_name="Eyaya Birara",
        date="20/06/2024",
        logo_path=logo_image_file_path,
    )
