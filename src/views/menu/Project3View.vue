<script>
import {onMounted, onUnmounted, ref} from 'vue';
import * as THREE from 'three';
import {TextureLoader} from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import CanvasFullScreen from '@/components/util/CanvasFullScreen.vue';
import ToggleFullScreen from '@/components/util/ToggleFullScreen.vue';
import {openGraphMixin} from '@/assets/ogimage/openGraphMixin';

export default {
  name: 'Project3',
  mixins: [openGraphMixin],
  components: { CanvasFullScreen, ToggleFullScreen },
  mounted() {
    const mainTitle = 'Model selection';
    const title = 'Couture Metaverse 3D - Model selection';
    const metaDescription = 'Couture Metaverse 3D';
    const description = 'Couture Metaverse 3D - Model selection';
    const imageUrl = 'https://couture-metaverse.vercel.app/assets/ogimage/bmp/project3.jpg';
    const url = 'https://couture-metaverse.vercel.app/project3';

    this.setOpenGraphTags(metaDescription, title, description, imageUrl, url);
    this.setPageTitle(mainTitle);
  },
  setup() {
    const canvasContainer = ref(null);
    let scene, camera, renderer, model;
    let isRotatingClockwise = false;
    let isRotatingCounterClockwise = false;
    let modelList = [];

    // Флаг для смешивания текстур и цветов
    const isMixingEnabled = ref(false);

    // Загрузка данных из localStorage
    const loadStoredModels = () => {
      try {
        const storedModels = localStorage.getItem('modelsSettings');
        return storedModels ? JSON.parse(storedModels) : null;
      } catch (error) {
        console.error("Ошибка при загрузке настроек моделей:", error);
        return null;
      }
    };

    // Сохранение данных в localStorage
    const saveModelsToStorage = () => {
      localStorage.setItem('modelsSettings', JSON.stringify(models));
    };

    // Загружаем данные из localStorage, иначе используем стандартные настройки
    const models = loadStoredModels() || {
      menShirt1: {
        path: '/assets/models/01_men_shirt.glb',
        name: 'Male regular T-shirt',
        icon: '/assets/img/models/01_men_shirt.webp',
        originalSettings: {
          texture: '/assets/textures/texture0.webp', // Путь к начальной текстуре
          color: new THREE.Color(0xffffff), // Начальный цвет
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5, // Уникальное значение яркости для модели
        },
        settings: {},
      },
      womenShirt: {
        path: '/assets/models/02_women_shirt.glb',
        name: 'Women oversized T-shirt',
        icon: '/assets/img/models/02_women_shirt.webp',
        originalSettings: {
          texture: '/assets/textures/texture0.webp',
          color: new THREE.Color(0xffffff), // Начальный цвет
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
        },
        settings: {},
      },
      menShirt2: {
        path: '/assets/models/03_men_shirt.glb',
        name: 'Male raglan polo T-shirt',
        icon: '/assets/img/models/03_men_shirt.webp',
        originalSettings: {
          texture: '/assets/textures/texture0.webp',
          color: new THREE.Color(0xffffff), // Начальный цвет
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
        },
        settings: {},
      },
      womenDress: {
        path: '/assets/models/04_dress.glb',
        name: 'Mid Victorian Evening Gown',
        icon: '/assets/img/models/04_dress.webp',
        originalSettings: {
          texture: '/assets/textures/texture0.webp',
          color: new THREE.Color(0xffffff), // Начальный цвет
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
        },
        settings: {},
      },
    };

    const storedModels = localStorage.getItem('modelsSettings');

    if (storedModels) {
      const parsedModels = JSON.parse(storedModels); // Парсим данные из localStorage
      for (const key in models) {
        if (parsedModels[key]) {
          models[key].settings = parsedModels[key].settings; // Восстанавливаем настройки
        } else {
          models[key].settings = { ...models[key].originalSettings }; // Если данных нет - сбрасываем
        }
      }
    } else {
      // Копируем оригинальные настройки в текущие настройки
      for (const key in models) {
        models[key].settings = { ...models[key].originalSettings };
      }
    }

    // Функция загрузки модели
    const loadModel = async (modelKey) => {
      clearScene(); // Очистка сцены перед загрузкой

      // Используем GLTFLoader для загрузки модели
      const loader = new GLTFLoader();
      try {
        const gltf = await loader.loadAsync(models[modelKey].path);
        // После загрузки модели добавляем её в сцену
        model = gltf.scene;
        model.userData.modelKey = modelKey; // Запоминаем, какая модель загружена
        model.scale.set(4, 4, 4);

        // Применяем сохранённые настройки модели
        updateMaterials((material) => {applyMaterialSettings(material);});

        // Определяем границы модели (bounding box)
        const boundingBox = new THREE.Box3().setFromObject(model);
        const height = boundingBox.max.y - boundingBox.min.y;
        // Сдвигаем модель вниз
        model.position.y = -height / 2;

        scene.add(model);
      } catch (error) {
        console.error('Ошибка загрузки модели', error);
      }
    };

    // Функция загрузки всех моделей
    const loadAllModels = async () => {
      clearScene(); // Очистка сцены перед загрузкой
      const loader = new GLTFLoader();
      const totalModels = Object.keys(models).length;
      const screenWidth = window.innerWidth;

      // Спейсер для моделей по оси X
      const spacing = screenWidth / totalModels / 230;
      let startX = -(totalModels - 1) * spacing / 2;
      let index = 0;

      let totalHeight = 0; // Общая высота всех моделей

      for (const key in models) {
        try {
          const gltf = await loader.loadAsync(models[key].path);
          const newModel = gltf.scene;

          // Привязываем модель к ключу
          newModel.userData.modelKey = key;

          // Размещаем модели в ряд
          const x = startX + index * spacing;
          newModel.position.set(x, 0, 0);
          newModel.scale.set(4, 4, 4);

          // Получаем высоту модели
          const box = new THREE.Box3().setFromObject(newModel);
          const modelHeight = box.max.y - box.min.y;

          // Размещаем модели по оси Y, чтобы они стояли на нижнем краю
          newModel.position.y = -modelHeight / 2;

          totalHeight += modelHeight; // Увеличиваем общую высоту всех моделей

          // Применяем сохранённые текстуры и цвета
          newModel.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              console.log(`Применяем материалы для ${key}`);

              // Применяем настройки материалов
              applyMaterialSettings(child.material, key);

              // Убедитесь, что материал обновляется
              child.material.needsUpdate = true;
            }
          });

          scene.add(newModel);
          modelList.push(newModel);
          index++;
        } catch (error) {
          console.error(`Ошибка загрузки модели ${key}:`, error);
        }
      }
    };

    // Очистка сцены перед загрузкой всех моделей
    const clearScene = () => {
      if (model) {
        scene.remove(model); // Убираем текущую модель
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
            if (child.geometry) {
              child.geometry.dispose();
            }
          }
        });
        model = null; // Обнуляем текущую модель
      }

      // Удаляем все предыдущие модели
      modelList.forEach((m) => {
        scene.remove(m);
        m.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
            if (child.geometry) {
              child.geometry.dispose();
            }
          }
        });
      });
      modelList = []; // Очищаем массив загруженных моделей
    };

    // Определение текстур
    const textures = {
      texture1: '/assets/textures/texture2.webp',
      texture2: '/assets/textures/texture5.webp',
    };

    const textureLoader = new TextureLoader();
    const textureCache = {};
    const getTexture = (path) => {
      if (!textureCache[path]) {
        textureCache[path] = textureLoader.load(path);
      }
      return textureCache[path];
    };

    // Функция применяет настройки материала
    const applyMaterialSettings = (material) => {
      if (!model || !model.userData.modelKey) return;
      const modelKey = model.userData.modelKey;
      const settings = models[modelKey]?.settings;

      if (!settings) {
        console.warn(`⚠️ Нет настроек для модели: ${modelKey}`);
        return;
      }

      let needsUpdate = false;

      // Преобразуем цвет из HEX в THREE.Color, если нужно
      const newColor = typeof settings.color === 'number' ? new THREE.Color(settings.color) : settings.color.clone();
      newColor.multiplyScalar(settings.brightnessMultiplier); // Применяем яркость

      // Загружаем текстуру, если она указана
      const newTexture = settings.texture ? getTexture(settings.texture) : null;

      // Если включено смешивание - применяем цвет и текстуру вместе
      if (isMixingEnabled.value && settings.texture) {
        if (!material.color.equals(newColor)) {
          material.color.set(newColor);
          needsUpdate = true;
        }
        if (material.map !== newTexture) {
          material.map = newTexture; // Применяем текстуру, если она изменилась
          needsUpdate = true;
        }
      }
      // Если текстура задана, но смешивание отключено - применяем только текстуру
      else if (!isMixingEnabled.value && settings.texture) {
        if (!material.color.equals(newColor)) {
          material.color.set(newColor);
          needsUpdate = true;
        }
        if (material.map !== newTexture) {
          material.map = newTexture;
          needsUpdate = true;
        }
      }
      // Если текстуры нет - применяем только цвет
      else {
        if (!material.color.equals(newColor)) {
          material.color.set(newColor);
          needsUpdate = true;
        }
        if (material.map) {
          material.map = null;
          needsUpdate = true;
        }
      }

      if (material.roughness !== settings.roughness || material.metalness !== settings.metalness) {
        material.roughness = settings.roughness;
        material.metalness = settings.metalness;
        needsUpdate = true;
      }

      if (needsUpdate) {
        material.needsUpdate = true;
      }
    };

    const init = () => {
      // Создаем сцену
      scene = new THREE.Scene();

      // Создаем камеру
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 3;

      // Создаем рендерер
      renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.addEventListener('change', () => renderer.render(scene, camera));

      scene.add(camera);

      // Добавляем освещение
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 5);
      scene.add(directionalLight);

      // Загружаем модель по умолчанию
      loadModel('womenShirt'); // По умолчанию загружается женская рубашка

      // Добавляем рендерер в контейнер
      canvasContainer.value.appendChild(renderer.domElement);

      // Обновляем сцену
      const animate = () => {
        requestAnimationFrame(animate);

        // Вращение модели по кнопкам
        if (model) {
          if (isRotatingClockwise) model.rotation.y += 0.01; // Вращение по часовой стрелке
          else if (isRotatingCounterClockwise) model.rotation.y -= 0.01; // Вращение против часовой стрелке
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animate();
    };

    // Универсальная функция для изменения материалов модели
    const updateMaterials = (callback) => {
      if (!model) return;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              callback(material);
            }
          });
        }
      });
    };

    // Изменение цвета модели
    const changeColor = (colorHex) => {
      if (!model) return;
      const modelKey = model.userData.modelKey;
      if (!modelKey) return;

      models[modelKey].settings.color = new THREE.Color(colorHex); // Обновляем настройки модели
      if (!isMixingEnabled.value) {
        models[modelKey].settings.texture = null; // Убираем текстуру, если смешивание выключено
      }

      saveModelsToStorage();
      updateMaterials((material) => {applyMaterialSettings(material);});
    };

    // Изменение текстуры модели
    const changeTexture = (textureKey) => {
      if (!model) return;
      const modelKey = model.userData.modelKey;
      if (!modelKey || !textures[textureKey]) return;

      models[modelKey].settings.texture = textures[textureKey]; // Обновляем настройки модели
      if (!isMixingEnabled.value) {
        models[modelKey].settings.color = models[modelKey].originalSettings.color; // Сбрасываем цвет к оригинальному, если смешивание выключено
      }

      saveModelsToStorage();
      updateMaterials((material) => {applyMaterialSettings(material);});
    };

    const toggleMixing = () => {
      isMixingEnabled.value = !isMixingEnabled.value;
      updateMaterials((material) => {applyMaterialSettings(material);});
      saveModelsToStorage(); // Сохранение изменений
    };

    // Загрузка текстуры с диска (FileReader.readAsDataURL())
    const uploadTexture = (event) => {
      const file = event.target.files[0];
      if (!file || !model) return;
      const modelKey = model.userData.modelKey;
      if (!modelKey) return;

      const reader = new FileReader();

      reader.onload = function (e) {
        // Обновляем настройки модели
        models[modelKey].settings.texture = e.target.result;
        if (!isMixingEnabled.value) {
          // Сбрасываем цвет к оригинальному, если смешивание выключено
          models[modelKey].settings.color = models[modelKey].originalSettings.color;
        }
        // Обновляем материалы после загрузки текстуры
        updateMaterials((material) => {applyMaterialSettings(material);});
        // Сохраняем изменения в localStorage
        saveModelsToStorage();
      };
      // Запускаем чтение файла
      reader.readAsDataURL(file);
    };

    // Загрузка текстуры с диска (URL.createObjectURL())
    // Требует явного освобождения памяти через URL.revokeObjectURL() после использования, иначе могут возникнуть утечки памяти!
    // const uploadTexture = (event) => {
    //   const file = event.target.files[0];
    //   if (!file || !model) return;
    //   const modelKey = model.userData.modelKey;
    //   if (!modelKey) return;
    //
    //   // Генерируем путь к файлу и сохраняем путь к файлу в настройках модели
    //   // Это создает временный URL для файла
    //   models[modelKey].settings.texture = URL.createObjectURL(file);
    //
    //   if (!isMixingEnabled.value) {
    //     models[modelKey].settings.color = models[modelKey].originalSettings.color; // Сбрасываем цвет к оригинальному, если смешивание выключено
    //   }
    //
    //   // Обновляем материалы
    //   updateMaterials((material) => {applyMaterialSettings(material);});
    //   // Сохраняем изменения в localStorage
    //   saveModelsToStorage();
    // };

    // Изменение цвета через палитру
    const changeColorFromPicker = (event) => {
      changeColor(event.target.value);
    };

    // Сброс настроек модели
    const resetModelSettings = () => {
      if (!model) return;
      const modelKey = model.userData.modelKey;
      if (!modelKey) return;

      models[modelKey].settings = { ...models[modelKey].originalSettings }; // Сбрасываем настройки к первоначальным

      updateMaterials((material) => {applyMaterialSettings(material);});
      saveModelsToStorage();
    };

    // Флаг для направления вращения перед паузой
    let lastRotationDirection = null;

    // Вращение по часовой стрелке
    const rotateClockwise = () => {
      isRotatingClockwise = true;
      isRotatingCounterClockwise = false;
      lastRotationDirection = 'clockwise';
    };

    // Вращение против часовой стрелке
    const rotateCounterClockwise = () => {
      isRotatingClockwise = false;
      isRotatingCounterClockwise = true;
      lastRotationDirection = 'counterclockwise';
    };

    // Пауза / Возобновление вращения
    const pauseRotation = () => {
      if (isRotatingClockwise || isRotatingCounterClockwise) {
        // Если модель вращается – пауза
        isRotatingClockwise = false;
        isRotatingCounterClockwise = false;
      } else {
        // Если модель на паузе – возобновляем в том же направлении
        if (lastRotationDirection === 'clockwise') {
          rotateClockwise();
        } else if (lastRotationDirection === 'counterclockwise') {
          rotateCounterClockwise();
        }
      }
    };

    // Полная остановка и сброс модели
    const stopRotation = () => {
      if (model) {
        model.rotation.set(0, 0, 0); // Сброс поворота модели
      }
      isRotatingClockwise = false;
      isRotatingCounterClockwise = false;
      lastRotationDirection = null; // Полностью сбрасываем направление
    };

    // Поворот модели на 180 градусов
    const rotate180 = () => {
      if (model) {
        model.rotation.y += Math.PI; // Добавляем 180 градусов (π радиан)
      }
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', onWindowResize);

    onMounted(() => {
      init();
      onWindowResize();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', onWindowResize);

      if (model) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  if (mat.map) mat.map.dispose(); // Освобождаем текстуры
                  mat.dispose();
                });
              } else {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
              }
            }
            if (child.geometry) {
              child.geometry.dispose();
            }
          }
        });
        scene.remove(model);
      }

      // Очистка текстурного кеша
      Object.values(textureCache).forEach(texture => texture.dispose());

      scene.clear();
      renderer.dispose();
    });


    return {
      canvasContainer,
      models,
      loadModel,
      loadAllModels,
      uploadTexture,
      changeColor,
      changeColorFromPicker,
      changeTexture,
      toggleMixing, // Возвращаем функцию для переключения смешивания
      isMixingEnabled, // Возвращаем состояние смешивания
      resetModelSettings,
      rotateClockwise,
      rotateCounterClockwise,
      pauseRotation,
      stopRotation,
      rotate180,
    };
  },
};
</script>

<template>
  <div class="container">
    <h1>{{ $t('project3.name') }} <CanvasFullScreen :canvasContainer="canvasContainer"></CanvasFullScreen> <ToggleFullScreen></ToggleFullScreen></h1>
    <line></line>
    <div class="scene-container" ref="canvasContainer"></div>

    <!-- Кнопки управления моделями -->
    <div class="model-selection">
      <img :src="models.menShirt1.icon" :alt="models.menShirt1.name" @click="loadModel('menShirt1')" class="button" :title="$t('models.menShirt1')">
      <img :src="models.womenShirt.icon" :alt="models.womenShirt.name" @click="loadModel('womenShirt')" class="button" :title="$t('models.womenShirt')">
      <img :src="models.menShirt2.icon" :alt="models.menShirt2.name" @click="loadModel('menShirt2')" class="button" :title="$t('models.menShirt2')">
      <img :src="models.womenDress.icon" :alt="models.womenDress.name" @click="loadModel('womenDress')" class="button" :title="$t('models.womenDress')">
      <button @click="loadAllModels" class="load-all-btn button" :title="$t('models.allModels')">
        <i class="fas fa-th-large"></i>
      </button>
    </div>

    <!-- Кнопки управления вращением -->
    <div class="rotation-controls">
      <button @click="rotateClockwise" :title="$t('rotating.clockwise')">
        <i class="fas fa-arrow-rotate-right"></i>
      </button>
      <button @click="pauseRotation" :title="$t('rotating.pause')">
        <i class="fas fa-pause"></i> <!-- Изменили иконку -->
      </button>
      <button @click="stopRotation" :title="$t('rotating.stop')">
        <i class="fas fa-stop"></i> <!-- Новая кнопка с reset-позицией -->
      </button>
      <button @click="rotate180" :title="$t('rotating.180')">
        <i class="fas fa-sync-alt"></i> <!-- Иконка поворота -->
      </button>
      <button @click="rotateCounterClockwise" :title="$t('rotating.counterclockwise')">
        <i class="fas fa-arrow-rotate-left"></i>
      </button>
    </div>

    <div class="model-controls">
      <!-- Кнопки выбора цвета -->
      <div class="color-controls">
        <button @click="changeColor(0xd0d0fb)" :title="$t ('changeColor.blue')" class="color-button" style="background-color: #d0d0fb;"></button>
        <button @click="changeColor(0xfaeeb2)" :title="$t ('changeColor.golden')" class="color-button" style="background-color: #faeeb2;"></button>
        <input type="color" @input="changeColorFromPicker" :title="$t ('changeColor.picker')" class="color-button color-picker"/>
      </div>
      <!-- Кнопки управления текстурами -->
      <div class="texture-controls">
        <img src="/assets/textures/texture2.webp" alt="texture2" @click="changeTexture('texture1')" class="button" :title="$t('texture.texture1')">
        <img src="/assets/textures/texture5.webp" alt="texture5" @click="changeTexture('texture2')" class="button" :title="$t('texture.texture2')">
        <!-- Кнопка для загрузки текстуры с диска -->
        <input type="file" @change="uploadTexture" id="file-input" class="file-input">
        <label for="file-input" class="button upload" :title="$t('texture.upload')">
          <i class="fa-solid fa-upload"></i>
        </label>
        <!-- Кнопка сброса -->
        <button @click="resetModelSettings" class="button reset" :title="$t('texture.reset')">
          <i class="fas fa-reply"></i>
        </button>
        <!-- Кнопка для включения/отключения смешивания -->
        <button @click="toggleMixing" :title="isMixingEnabled ? $t('rotating.mixYes') : $t('rotating.mixNo')" class="mixing" :class="{'active': isMixingEnabled}">
          <i :class="isMixingEnabled ? 'fas fa-sliders-h' : 'fas fa-gem'"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  flex: 1 0 auto;
  background: linear-gradient(to bottom, rgb(229, 255, 229), rgb(250, 247, 234)) no-repeat center;
  h1 {font-size: 2.5rem;margin: 0.7rem auto;color: black;}
  .scene-container {
    max-height: 70vh;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .model-selection {
    position: absolute;
    top: 170px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;

    .button {
      width: 50px;
      height: 50px;
      color: white;
      border: none;
      cursor: pointer;
      border-radius: 5px;
      //background-color: #a9ed9f;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
      transition: ease-in-out, color .2s, background-color .2s, box-shadow .2s;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden; /* Скрываем части изображения, выходящие за границы контейнера */

      &:hover {
        //background-color: #2cbd03; /* Более яркий цвет при наведении */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      img {
        width: 100%; /* Ширина изображения соответствует ширине контейнера */
        height: 100%; /* Высота изображения соответствует высоте контейнера */
        object-fit: cover; /* Сохраняет пропорции изображения и заполняет контейнер */
        display: block; /* Убирает нижний отступ у изображений */
      }

    }

    .load-all-btn {
      background: #6f1f8e;
      color: white;
      font-size: 24px;
      .fas {color: white;}
    }
    .load-all-btn:hover {.fas {color: gold;} background: #9760aa;}
  }

  .rotation-controls {
    position: absolute;
    bottom: 80px; // Перемещаем вниз
    left: 50%; // Центрируем
    transform: translateX(-50%); // Смещаем на половину ширины
    display: flex;
    flex-direction: row; // Горизонтальное расположение
    gap: 20px; // Отступ между кнопками

    button {
      width: 50px;
      height: 50px;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 24px;
      border-radius: 5px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #87ceeb;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
      transition: ease-in-out, background-color .2s, box-shadow .2s;

      &:hover {
        background-color: #00bfff; /* Более яркий цвет при наведении */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .model-controls {
    position: absolute;
    left: 40px; /* Размещение кнопок слева */
    top: 55%;
    transform: translateY(-50%);

    .color-controls {
      display: flex;
      flex-direction: column;

      .color-button {
        width: 50px;
        height: 50px;
        border: 1px solid #ccc;
        margin-bottom: 10px;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
        transition: background-color 0.2s, box-shadow 0.2s;

        &:hover {box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);}
      }
      .color-picker {
        padding: 0;
        border-radius: 5px;
      }
      .reset-button {
        background-color: #f0f0f0;
        border: 1px solid #ccc;

        &:hover {background-color: #e0e0e0;}
        .fas {font-size: 24px;}
      }
    }

    .texture-controls {
      display: flex;
      flex-direction: column;
      .button {
        width: 50px;
        height: 50px;
        margin-bottom: 10px;
        cursor: pointer;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
        transition: background-color 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden; /* Скрываем части изображения, выходящие за границы контейнера */

        .fa-solid, .fa-brands, .fas { font-size: 24px; }

        &:hover { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }

        img {
          width: 100%; /* Ширина изображения соответствует ширине контейнера */
          height: 100%; /* Высота изображения соответствует высоте контейнера */
          object-fit: cover; /* Сохраняет пропорции изображения и заполняет контейнер */
          display: block; /* Убирает нижний отступ у изображений */
        }
      }

      .upload {
        width: 50px;
        height: 50px;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;
        background-color: dodgerblue;
        //background: linear-gradient(to bottom, rgb(229, 255, 229), rgb(250, 247, 234)) no-repeat center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.9);
        transition: ease-in-out, background-color .2s, box-shadow .2s;
        &:hover {
          background-color: mediumvioletred;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      }

      .reset {
        color: black;
        background-color: #f0f0f0;
        border: 1px solid #ccc;

        &:hover {background-color: #e0e0e0;}
      }

      /* Скрываем оригинальный input */
      .file-input {display: none;}

      .mixing {
        width: 50px;
        height: 50px;
        font-size: 24px;
        border: none;
        border-radius: 5px;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: red;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.9);
        transition: ease-in-out, background-color .2s, box-shadow .2s;
        &:hover {
          background-color: mediumvioletred;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      }

      .active {
        background-color: darkgreen;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.9);
        transition: ease-in-out, background-color .2s, box-shadow .2s;
        &:hover {
          background-color: mediumseagreen;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          i {transform: rotate(180deg); } /* При активном состоянии иконка может анимированно поворачиваться */
        }
      }

    }
  }
}

@media(max-width: 1020px) {
  .container {
    h1 {font-size: 2.3rem;margin: 0.6rem auto;}

    .model-selection {
      top: 165px;
      gap: 15px;

      .button {
        width: 45px;
        height: 45px;
      }
      .load-all-btn {display: none;}
    }

    .rotation-controls {
      bottom: 80px;
      gap: 15px;

      button {
        width: 45px;
        height: 45px;
        font-size: 22px;
      }
    }

    .model-controls {
      left: 22px; /* Размещение кнопок слева */
      top: 54%;
      .color-controls {
        .color-button {
          width: 45px;
          height: 45px;
          margin-bottom: 9px;
        }
        .color-picker {
          width: 45px;
          height: 45px;
          margin-bottom: 9px;
        }
        .reset-button {
          .fas {font-size: 22px;}
        }
      }

      .texture-controls {
        .button {
          width: 45px;
          height: 45px;
          margin-bottom: 9px;
          .fa-solid,.fa-brands,.fas {font-size: 22px;}
        }
        .mixing {
          width: 45px;
          height: 45px;
          font-size: 22px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .container {
    h1 {font-size: 2rem;margin: 0.5rem auto;}
    .model-selection {
      top: 150px;
      gap: 10px;

      .button {
        width: 40px;
        height: 40px;
      }
      .load-all-btn {display: none;}
    }

    .rotation-controls {
      bottom: 20px;
      gap: 10px;

      button {
        width: 40px;
        height: 40px;
        font-size: 18px;
      }
    }

    .model-controls {
      left: 20px; /* Размещение кнопок слева */
      top: 59%;
      .color-controls {
        .color-button {
          width: 40px;
          height: 40px;
          margin-bottom: 8px;
        }
        .color-picker {
          width: 40px;
          height: 40px;
          margin-bottom: 8px;
        }
        .reset-button {
          .fas {font-size: 18px;}
        }
      }

      .texture-controls {
        .button {
          width: 40px;
          height: 40px;
          margin-bottom: 8px;
          .fa-solid,.fa-brands,.fas {font-size: 18px;}
        }
        .mixing {
          width: 40px;
          height: 40px;
          font-size: 18px;
        }
      }
    }
  }
}
</style>