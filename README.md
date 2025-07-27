## 🐶 Dog Breed Identifier Web App
A full-stack web application that predicts the breed of a dog from an uploaded image using a deep learning model (MobileNetV2). The app also provides visual explanations using LIME.

### 🚀 Features
-  User Authentication (Signup/Login)
-  Upload dog images for breed classification
-  Display top prediction along with its confidence score 
-  View Top-5 predictions with confidence scores by clciking on **"View Analysis"**
-  Visual explanations using LIME
- Lets you view the LIME progress as a bar, indicating how many perturbations have been completed
-  View history per user
-  Remove individual entries from history using **"Clear"**
-  Remove all the entries from history using **"Clear All"**

### 📸 How It Works

1. Upload a dog image through the frontend.
2. Flask backend resizes and normalizes the image.
3. The MobileNetV2 model predicts the dog breed.
4. The top prediction is displayed with confidence.
5. Optionally, request a **LIME** visualization to see the regions of the image that influenced the prediction.

### 🧠 Model Details

- **Architecture**: MobileNetV2 (pretrained on ImageNet)
- **Framework**: TensorFlow / Keras
- **Input Size**: 224 × 224 × 3
- **Loss Function**: Categorical Crossentropy
- **Optimizer**: Adam

