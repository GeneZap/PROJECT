import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "CNN_CGR_DATASET_FIXED") 
OUTPUT_DIR = os.path.join(BASE_DIR, "V3_Model_Output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("🚀 INITIATING ADVANCED V3 TRANSFER LEARNING (MobileNetV2)...")

train_datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2, horizontal_flip=True, vertical_flip=True)
val_datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)

train_gen = train_datagen.flow_from_directory(DATASET_DIR, target_size=(256, 256), batch_size=16, class_mode='binary', subset='training')
val_gen = val_datagen.flow_from_directory(DATASET_DIR, target_size=(256, 256), batch_size=16, class_mode='binary', subset='validation')

# Calculate weights to fix the class imbalance
res_count = sum(1 for cls in train_gen.classes if cls == 0)
sus_count = sum(1 for cls in train_gen.classes if cls == 1)
total = res_count + sus_count
class_weights = {0: total / (2 * max(1, res_count)), 1: total / (2 * max(1, sus_count))}

# --- THE UPGRADE: MobileNetV2 ---
base_model = MobileNetV2(input_shape=(256, 256, 3), include_top=False, weights='imagenet')
base_model.trainable = False # Freeze the core brain so it trains FAST

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.4),
    layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3), loss='binary_crossentropy', metrics=['accuracy'])

callbacks = [
    EarlyStopping(patience=5, restore_best_weights=True),
    ReduceLROnPlateau(factor=0.5, patience=2),
    ModelCheckpoint(os.path.join(OUTPUT_DIR, "v3_vision_model.h5"), save_best_only=True)
]

print("🧠 Training Top Layers...")
model.fit(train_gen, validation_data=val_gen, epochs=15, callbacks=callbacks, class_weight=class_weights)

print("✅ ADVANCED V3 SAVED.")