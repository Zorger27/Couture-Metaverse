<script>
import {inject, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import jsPDF from "jspdf";
import * as THREE from 'three';
import {TextureLoader} from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import CanvasFullScreen from '@/components/util/CanvasFullScreen.vue';
import ToggleFullScreen from '@/components/util/ToggleFullScreen.vue';
import {openGraphMixin} from '@/assets/ogimage/openGraphMixin';

export default {
  name: 'Project2',
  mixins: [openGraphMixin],
  components: {CanvasFullScreen, ToggleFullScreen},
  mounted() {
    const mainTitle = 'Saving the model';
    const title = 'Couture Metaverse 3D - Saving the model';
    const metaDescription = 'Couture Metaverse 3D';
    const description = 'Couture Metaverse 3D - Saving the model';
    const imageUrl = 'https://couture-metaverse.vercel.app/assets/ogimage/bmp/project2.jpg';
    const url = 'https://couture-metaverse.vercel.app/project2';

    this.setOpenGraphTags(metaDescription, title, description, imageUrl, url);
    this.setPageTitle(mainTitle);
    this.setCanonical(url);
  },
  setup() {
    const { t } = useI18n();
    const toggleFooter = inject('toggleFooter');
    const isFooterHidden = inject('isFooterHidden');
    const canvasContainer = ref(null);
    let scene, camera, renderer, model;
    let sceneGroup = null; // Эта переменная будет использоваться для всех моделей
    const isMixingEnabled = ref(false); // Флаг для смешивания текстур и цветов
    const showSaveOptions = ref(false);
    const isRecording = ref(false); // Показываем статус записи
    const showColorMenu = ref(false);
    const showTextureMenu = ref(false);
    const currentModelKey = ref(null);  // 🏷 Переменная для отслеживания текущей модели
    const isMultiModelView = ref(false); // 🏷 Флаг для обычного режима "1x4 модели"
    const isThreeDView = ref(false); // 🏷 Флаг для режима "2x2 модели"

    let modelList = [];

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

    // Удаление данных из localStorage с подтверждением и восстановлением оригинальных настроек
    const clearLocalStorage = async () => {
      const modelsSettings = localStorage.getItem('modelsSettings');

      if (modelsSettings) {
        const confirmed = confirm(t('special.confirm'));

        if (confirmed) {
          // Удаляем данные из localStorage
          localStorage.removeItem('modelsSettings');

          // Восстанавливаем оригинальные настройки для всех моделей
          for (const key in models) {
            // Восстанавливаем настройки и добавляем пустые настройки логотипа
            models[key].settings = {
              ...models[key].originalSettings,
              logo: {
                imageData: null,
                positionX: 0,
                positionY: 0,
                scale: 1,
              }
            };
          }

          // Если текущая модель загружена, перезагружаем её
          if (model && model.userData.modelKey) {
            const currentModelKey = model.userData.modelKey;

            // Очищаем сцену
            clearScene();

            // Перезагружаем модель с оригинальными настройками
            await loadModel(currentModelKey);
          }

          // Принудительно обновляем рендер несколько раз
          if (renderer && scene && camera) {
            // Первый рендер
            renderer.render(scene, camera);

            // Дополнительный рендер через небольшую задержку
            setTimeout(() => {
              renderer.render(scene, camera);
            }, 100);
          }

          alert(t('special.alertYes'));
        } else {
          alert(t('special.alertNo'));
        }
      } else {
        alert(t('special.noData'));
      }
    };

    // Загружаем данные из localStorage, иначе используем стандартные настройки
    const models = loadStoredModels() || {
      menShirt1: {
        path: '/assets/models/01_men_shirt.glb',
        name: 'models.menShirt1',
        icon: '/assets/img/models/01_men_shirt.webp',
        originalSettings: {
          texture: '/assets/textures/materialTexture1.webp',
          color: new THREE.Color(0xffffff),
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
          logo: {
            imageData: null,
            positionX: 0,
            positionY: 0,
            scale: 1
          }
        },
        settings: {
          texture: '/assets/textures/materialTexture1.webp',
          color: new THREE.Color(0xffffff),
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
          logo: {
            imageData: null,
            positionX: 0,
            positionY: 0,
            scale: 1
          }
        },
      },
      womenShirt: {
        path: '/assets/models/02_women_shirt.glb',
        name: 'models.womenShirt',
        icon: '/assets/img/models/02_women_shirt.webp',
        originalSettings: {
          texture: '/assets/textures/materialTexture2.webp',
          color: new THREE.Color(0xffffff),
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
          logo: {
            imageData: null,
            positionX: 0,
            positionY: 0,
            scale: 1
          }
        },
        settings: {
          texture: '/assets/textures/materialTexture2.webp',
          color: new THREE.Color(0xffffff),
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
          logo: {
            imageData: null,
            positionX: 0,
            positionY: 0,
            scale: 1
          }
        },
      },
      menShirt2: {
        path: '/assets/models/03_men_shirt.glb',
        name: 'models.menShirt2',
        icon: '/assets/img/models/03_men_shirt.webp',
        originalSettings: {
          texture: '/assets/textures/materialTexture3.webp',
          color: new THREE.Color(0xffffff),
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
          logo: {
            imageData: null,
            positionX: 0,
            positionY: 0,
            scale: 1
          }
        },
        settings: {
          texture: '/assets/textures/materialTexture3.webp',
          color: new THREE.Color(0xffffff),
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
          logo: {
            imageData: null,
            positionX: 0,
            positionY: 0,
            scale: 1
          }
        },
      },
      womenDress: {
        path: '/assets/models/04_dress.glb',
        name: 'models.womenDress',
        icon: '/assets/img/models/04_dress.webp',
        originalSettings: {
          texture: '/assets/textures/materialTexture1.webp',
          color: new THREE.Color(0xffffff),
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
          logo: {
            imageData: null,
            positionX: 0,
            positionY: 0,
            scale: 1
          }
        },
        settings: {
          texture: '/assets/textures/materialTexture1.webp',
          color: new THREE.Color(0xffffff),
          roughness: 0.1,
          metalness: 0.5,
          brightnessMultiplier: 4.5,
          logo: {
            imageData: null,
            positionX: 0,
            positionY: 0,
            scale: 1
          }
        },
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

    // Функция загрузки одной модели
    const loadModel = async (modelKey) => {
      isMultiModelView.value = false; // 📌 Показываем панель
      isThreeDView.value = false; // Выключаем 2x2 режим
      currentModelKey.value = modelKey; // Запоминаем ключ модели

      clearScene(); // Очистка текущей сцены перед загрузкой новой модели

      // Создаём `sceneGroup`, чтобы не ломалось вращение
      sceneGroup = new THREE.Group();
      scene.add(sceneGroup);

      const loader = new GLTFLoader();
      try {
        const gltf = await loader.loadAsync(models[modelKey].path);
        model = gltf.scene;

        // Запоминаем, какая модель загружена
        model.userData.modelKey = modelKey;

        // Центрируем модель в сцене
        model.position.set(0, 0, 0);
        model.scale.set(4, 4, 4);

        // Добавляем модель в `sceneGroup`
        sceneGroup.add(model);

        // Добавляем модель в rotationStates
        rotationStates.set(modelKey, { clockwise: false, counterClockwise: false });

        // Применяем материалы и текстуры
        const materialPromises = [];
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            materialPromises.push(applyMaterialSettings(child.material, modelKey));
          }
        });

        await Promise.all(materialPromises);

        // Определяем границы модели (bounding box)
        const boundingBox = new THREE.Box3().setFromObject(model);
        const height = boundingBox.max.y - boundingBox.min.y;
        // Сдвигаем модель вниз
        model.position.y = -height / 2;

        // Обновляем рендер, чтобы изменения сразу стали видны
        requestAnimationFrame(() => renderer.render(scene, camera));
      } catch (error) {
        console.error(`Ошибка загрузки модели ${modelKey}:`, error);
      }
    };

    // Функция загрузки всех моделей
    const loadAllModels = async () => {
      isMultiModelView.value = true; // 📌 Скрываем панель
      isThreeDView.value = false; // Выключаем 2x2 режим
      currentModelKey.value = null;

      clearScene(); // Очистка сцены перед загрузкой
      const loader = new GLTFLoader();
      const totalModels = Object.keys(models).length;

      // Создаём группу для моделей
      sceneGroup = new THREE.Group();
      scene.add(sceneGroup);

      // Определяем максимальные размеры для нормализации
      let maxModelHeight = 0;
      let maxModelWidth = 0;
      let modelsArray = [];

      // 1️⃣ Загружаем модели и вычисляем их размеры
      let modelPromises = Object.keys(models).map(async (key, index) => {
        try {
          const gltf = await loader.loadAsync(models[key].path);
          const model = gltf.scene;
          model.userData.modelKey = key;

          // Вычисляем boundingBox
          let boundingBox = new THREE.Box3().setFromObject(model);
          const modelWidth = boundingBox.max.x - boundingBox.min.x;
          const modelHeight = boundingBox.max.y - boundingBox.min.y;

          maxModelWidth = Math.max(maxModelWidth, modelWidth);
          maxModelHeight = Math.max(maxModelHeight, modelHeight);

          console.log(`✅ ${key}: Высота = ${modelHeight}, Ширина = ${modelWidth}`);

          modelsArray[index] = model; // **Сохраняем порядок моделей**

          // 📌 Добавляем модель в rotationStates (по умолчанию остановлена)
          rotationStates.set(key, { clockwise: false, counterClockwise: false });

        } catch (error) {
          console.error(`❌ Ошибка загрузки модели ${key}:`, error);
        }
      });

      // Ждём, пока все модели загрузятся
      await Promise.all(modelPromises);
      console.log(`📏 Максимальная высота: ${maxModelHeight}, максимальная ширина: ${maxModelWidth}`);

      // 2️⃣ Второй проход — нормализация размеров и позиционирование
      let materialPromises = [];
      const spacing = maxModelWidth * 3.2; // БОЛЬШЕ отступов между моделями
      let startX = -(totalModels - 1) * spacing / 2;

      modelsArray.forEach((model, index) => {
        const modelKey = model.userData.modelKey;

        // 1. Пересчитываем boundingBox до масштабирования
        let boundingBox = new THREE.Box3().setFromObject(model);

        // 2. Масштабируем модели так, чтобы их высота ≈ 1.8 (уменьшаем!)
        const scaleFactor = 1.8 / maxModelHeight;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // 3. Пересчитываем boundingBox после масштабирования
        boundingBox.setFromObject(model);

        // 4. Размещаем модели по оси X, равномерно
        model.position.x = startX + index * spacing;

        console.log(`📍 ${modelKey} -> X: ${model.position.x}, Y: ${model.position.y}, Масштаб: ${scaleFactor}`);

        // 5. Применяем материалы и текстуры
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            materialPromises.push(applyMaterialSettings(child.material, modelKey));
          }
        });

        // Добавляем модель в сцену (в правильном порядке!)
        sceneGroup.add(model);
      });

      // Ждём, пока все материалы обновятся
      await Promise.all(materialPromises);

      // 6️⃣ Сдвигаем всю группу вниз, чтобы она стояла на "полу"
      const groupBoundingBox = new THREE.Box3().setFromObject(sceneGroup);
      const groupHeight = groupBoundingBox.max.y - groupBoundingBox.min.y;
      sceneGroup.position.y = -groupBoundingBox.min.y - groupHeight * 0.5;

      console.log(`🎯 Группа -> X: ${sceneGroup.position.x}, Y: ${sceneGroup.position.y}`);

      // Перерисовываем сцену после всех изменений
      requestAnimationFrame(() => renderer.render(scene, camera));
      console.log("🎉 Все модели загружены, панель скрыта!");
    };

    // Функция загрузки всех моделей (2 спереди, 2 сзади)
    const loadAllModels3d = async () => {
      isThreeDView.value = true; // Указываем, что это 2x2 компоновка
      isMultiModelView.value = false;
      currentModelKey.value = null;

      clearScene(); // Очистка сцены перед загрузкой
      const loader = new GLTFLoader();

      // Создаём группу для моделей
      sceneGroup = new THREE.Group();
      scene.add(sceneGroup);

      // Определяем максимальные размеры для нормализации
      let maxModelHeight = 0;
      let maxModelWidth = 0;
      let modelsArray = [];

      // 1️⃣ Загружаем модели и вычисляем их размеры
      let modelPromises = Object.keys(models).map(async (key, index) => {
        try {
          const gltf = await loader.loadAsync(models[key].path);
          const model = gltf.scene;
          model.userData.modelKey = key;

          // Вычисляем boundingBox
          let boundingBox = new THREE.Box3().setFromObject(model);
          const modelWidth = boundingBox.max.x - boundingBox.min.x;
          const modelHeight = boundingBox.max.y - boundingBox.min.y;

          maxModelWidth = Math.max(maxModelWidth, modelWidth);
          maxModelHeight = Math.max(maxModelHeight, modelHeight);

          console.log(`✅ ${key}: Высота = ${modelHeight}, Ширина = ${modelWidth}`);

          modelsArray[index] = model; // **Сохраняем порядок моделей**

          // 📌 Добавляем модель в rotationStates (по умолчанию остановлена)
          rotationStates.set(key, { clockwise: false, counterClockwise: false });

        } catch (error) {
          console.error(`❌ Ошибка загрузки модели ${key}:`, error);
        }
      });

      // Ждём, пока все модели загрузятся
      await Promise.all(modelPromises);
      console.log(`📏 Максимальная высота: ${maxModelHeight}, максимальная ширина: ${maxModelWidth}`);

      // 2️⃣ Второй проход — нормализация размеров и позиционирование
      let materialPromises = [];
      const frontScale = 1.8 / maxModelHeight;
      const backScale = frontScale * 0.8; // Задние модели меньше
      const spacingX = maxModelWidth * 4.0; // Отступы по X
      const spacingZ = maxModelWidth * 2.5; // Отступы по Z (глубина)

      modelsArray.forEach((model, index) => {
        const modelKey = model.userData.modelKey;
        const isBackRow = index >= 2;

        // 1. Устанавливаем разные масштабы для переднего и заднего ряда
        const scaleFactor = isBackRow ? backScale : frontScale;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // 2. Пересчитываем boundingBox после масштабирования
        let boundingBox = new THREE.Box3().setFromObject(model);

        // 3. Центрируем модели в ряду
        const xOffset = isBackRow ? -spacingX / 2 : 0;
        model.position.x = xOffset + (index % 2 === 0 ? -spacingX / 2 : spacingX / 2);
        model.position.z = isBackRow ? -spacingZ : 0; // Отодвигаем задний ряд

        // 4. Выравниваем модели по полу
        model.position.y = -boundingBox.min.y;

        console.log(`📍 ${modelKey} -> X: ${model.position.x}, Z: ${model.position.z}, Y: ${model.position.y}, Масштаб: ${scaleFactor}`);

        // 5. Применяем материалы и текстуры
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            materialPromises.push(applyMaterialSettings(child.material, modelKey));
          }
        });

        // Добавляем модель в сцену (в правильном порядке!)
        sceneGroup.add(model);
      });

      // Ждём, пока все материалы обновятся
      await Promise.all(materialPromises);

      // 6️⃣ Сдвигаем всю группу вниз, чтобы она стояла на "полу"
      const groupBoundingBox = new THREE.Box3().setFromObject(sceneGroup);
      const groupHeight = groupBoundingBox.max.y - groupBoundingBox.min.y;
      sceneGroup.position.y = -groupBoundingBox.min.y - groupHeight * 0.5;

      console.log(`🎯 Группа -> X: ${sceneGroup.position.x}, Y: ${sceneGroup.position.y}`);

      // Перерисовываем сцену после всех изменений
      requestAnimationFrame(() => renderer.render(scene, camera));
      console.log("🎉 Все модели загружены (2 спереди, 2 сзади) и выровнены!");
    };

    // Функция очистки сцены
    const clearScene = () => {
      // Удаляем группу с моделями, если она существует
      if (sceneGroup) {
        scene.remove(sceneGroup); // Убираем группу
        sceneGroup.traverse((child) => {
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
        sceneGroup = null; // Обнуляем ссылку на группу
      }

      // Если загружена одна модель
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

      // Если есть список моделей (для loadAllModels)
      if (modelList && modelList.length > 0) {
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
      }
    };

    // Определение текстур
    const textures = {
      texture1: '/assets/textures/texture1.webp',
      texture2: '/assets/textures/texture2.webp',
      texture3: '/assets/textures/texture3.webp',
      texture4: '/assets/textures/texture4.webp',
      texture5: '/assets/textures/texture5.webp'
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
    const applyMaterialSettings = async (material, modelKey) => {
      if (!models[modelKey]) {
        console.warn(`⚠️ Нет настроек для модели: ${modelKey}`);
        return;
      }

      const settings = models[modelKey].settings;
      if (!settings) return;

      let needsUpdate = false;

      // Преобразуем цвет из HEX в THREE.Color, если нужно
      const newColor = new THREE.Color(settings.color);
      newColor.multiplyScalar(settings.brightnessMultiplier); // Применяем яркость

      // Загружаем текстуру, если она указана (асинхронно)
      const newTexture = settings.texture ? await getTexture(settings.texture) : null;

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

      // Применяем roughness и metalness
      if (material.roughness !== settings.roughness || material.metalness !== settings.metalness) {
        material.roughness = settings.roughness;
        material.metalness = settings.metalness;
        needsUpdate = true;
      }

      // Обновляем сцену, если были изменения
      if (needsUpdate) {
        material.needsUpdate = true;
        // setTimeout(() => renderer.render(scene, camera), 50); // Небольшая задержка для обновления
        renderer.render(scene, camera);
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
      loadModel('menShirt2'); // По умолчанию загружается мужская тенниска

      // Добавляем рендерер в контейнер
      canvasContainer.value.appendChild(renderer.domElement);

      // Обновляем сцену
      const animate = () => {
        requestAnimationFrame(animate);

        // Проверяем, инициализирована ли `sceneGroup`
        if (sceneGroup && sceneGroup.children.length > 0) {
          sceneGroup.children.forEach((model) => {
            const modelKey = model.userData.modelKey;
            const state = rotationStates.get(modelKey);

            if (state?.clockwise) model.rotation.y += 0.02;
            else if (state?.counterClockwise) model.rotation.y -= 0.02;
          });
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animate();
    };

    // Универсальная функция для изменения материалов модели
    const updateMaterials = (callback) => {
      return new Promise((resolve) => {
        if (!model) return resolve();  // Если нет модели, сразу возвращаем Promise

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

        resolve(); // Когда traverse завершится, возвращаем Promise
      });
    };

    // Функция изменения цвета модели
    const changeColor = (colorHex) => {
      if (!model) return;
      const modelKey = model.userData.modelKey;
      if (!modelKey) return;

      models[modelKey].settings.color = new THREE.Color(colorHex); // Обновляем настройки модели
      if (!isMixingEnabled.value) {
        models[modelKey].settings.texture = null; // Убираем текстуру, если смешивание выключено
      }

      saveModelsToStorage();
      updateMaterials((material) => {applyMaterialSettings(material, modelKey);});

      // setTimeout(() => renderer.render(scene, camera), 50); // Обновляем рендер после смены цвета
      renderer.render(scene, camera);
    };

    // Функция изменения текстуры модели
    const changeTexture = (textureKey) => {
      if (!model) return;
      const modelKey = model.userData.modelKey;
      if (!modelKey || !textures[textureKey]) return;

      models[modelKey].settings.texture = textures[textureKey]; // Обновляем настройки модели
      if (!isMixingEnabled.value) {
        models[modelKey].settings.color = models[modelKey].originalSettings.color; // Сбрасываем цвет к оригинальному, если смешивание выключено
      }

      saveModelsToStorage();
      updateMaterials((material) => {applyMaterialSettings(material, modelKey);});

      // setTimeout(() => renderer.render(scene, camera), 50); // Обновляем рендер после смены текстуры
      renderer.render(scene, camera);
    };

    const toggleMixing = () => {
      isMixingEnabled.value = !isMixingEnabled.value;
      updateMaterials((material) => {applyMaterialSettings(material);});
      saveModelsToStorage(); // Сохранение изменений
    };

    // Загрузка текстуры с диска (FileReader.readAsDataURL())
    const uploadTexture = async (event) => {
      // Получаем файл из события, если его нет — прекращаем выполнение функции
      const file = event.target.files[0];
      if (!file || !model) return;  // Если файл или модель не найдены, прекращаем выполнение

      // Получаем ключ модели, если он отсутствует — прекращаем выполнение
      const modelKey = model.userData.modelKey;
      if (!modelKey) return;

      // Создаём новый объект FileReader для чтения содержимого файла
      const reader = new FileReader();

      // Оборачиваем FileReader в Promise для асинхронной загрузки текстуры
      const loadTexture = new Promise((resolve, reject) => {
        // Если чтение файла прошло успешно, разрешаем Promise с результатом (DataURL)
        reader.onload = function (e) {
          resolve(e.target.result);  // Передаем результат чтения файла
        };

        // Если произошла ошибка при чтении файла, отклоняем Promise с ошибкой
        reader.onerror = function (error) {
          reject(error);  // Отклоняем Promise с ошибкой
        };

        // Запускаем чтение файла как DataURL (встроенный формат для изображений)
        reader.readAsDataURL(file);
      });

      try {
        // Ждем завершения загрузки текстуры и обновляем настройки модели
        models[modelKey].settings.texture = await loadTexture;

        // Если смешивание текстуры выключено, сбрасываем цвет модели к оригинальному
        if (!isMixingEnabled.value) {
          models[modelKey].settings.color = models[modelKey].originalSettings.color;
        }

        // Обновляем все материалы модели с применением новых настроек
        await updateMaterials((material) => {
          applyMaterialSettings(material, modelKey);  // Применяем настройки к материалам
        });

        // Сохраняем обновленные настройки модели в localStorage
        saveModelsToStorage();
      } catch (error) {
        // Обработка ошибок при загрузке текстуры
        console.error('Ошибка при загрузке текстуры:', error);
      }
    };

    // Изменение цвета через палитру
    const changeColorFromPicker = (event) => {
      changeColor(event.target.value);
    };

    // Сброс настроек модели
    const resetModelSettings = async () => {
      if (!model) return;

      const modelKey = model.userData.modelKey;
      if (!modelKey) return;

      // Восстанавливаем настройки модели из оригинальных
      const originalSettings = models[modelKey].originalSettings;
      models[modelKey].settings = { ...originalSettings };

      await updateMaterials((material) => {applyMaterialSettings(material, modelKey);});

      // Сохраняем изменения в localStorage
      saveModelsToStorage();

      // Принудительная перерисовка сцены
      renderer.render(scene, camera);
    };

    // Флаг для направления вращения перед паузой
    let lastRotationDirection = null;

    // Флаг для хранения направлений вращения каждой модели
    let rotationStates = new Map(); // { modelKey: { clockwise: true/false, counterClockwise: true/false } }

    // Вращение по часовой стрелке (для всех моделей)
    const rotateClockwise = () => {
      rotationStates.forEach((state) => {
        state.clockwise = true;
        state.counterClockwise = false;
      });
      lastRotationDirection = 'clockwise';
    };

    // Вращение против часовой стрелке (для всех моделей)
    const rotateCounterClockwise = () => {
      rotationStates.forEach((state) => {
        state.clockwise = false;
        state.counterClockwise = true;
      });
      lastRotationDirection = 'counterclockwise';
    };

    // Пауза / Возобновление вращения (для всех моделей)
    const pauseRotation = () => {
      rotationStates.forEach((state) => {
        if (state.clockwise || state.counterClockwise) {
          state.clockwise = false;
          state.counterClockwise = false;
        } else {
          state.clockwise = lastRotationDirection === "clockwise";
          state.counterClockwise = lastRotationDirection === "counterclockwise";
        }
      });
    };

    // Остановка и сброс вращения (для всех моделей)
    const stopRotation = () => {
      sceneGroup.children.forEach((model) => {
        model.rotation.set(0, 0, 0);
      });

      rotationStates.forEach((state) => {
        state.clockwise = false;
        state.counterClockwise = false;
      });

      lastRotationDirection = null;
    };

    // Поворот на 180 градусов (для всех моделей)
    const rotate180 = () => {
      sceneGroup.children.forEach((model) => {
        model.rotation.y += Math.PI;
      });
    };

    // Переключение меню
    const toggleSaveMenu = () => {showSaveOptions.value = !showSaveOptions.value;};

    // Закрывает меню после нажатия на кнопку
    const closeSaveMenu = () => {
      if (!isRecording.value) { // Не закрываем меню, если идет запись
        showSaveOptions.value = false;
      }
    };

    const toggleColorMenu = () => {
      showColorMenu.value = !showColorMenu.value;
      if (showColorMenu.value) showTextureMenu.value = false; // Закрываем другое меню
    };

    const closeColorMenu = () => {showColorMenu.value = false;};

    const toggleTextureMenu = () => {
      showTextureMenu.value = !showTextureMenu.value;
      if (showTextureMenu.value) showColorMenu.value = false; // Закрываем другое меню
    };

    const closeTextureMenu = () => {showTextureMenu.value = false;};

    const closeAllMenus = () => {
      if (isRecording.value) {
        showSaveOptions.value = true;
        showColorMenu.value = false;
        showTextureMenu.value = false;
      } else {
        showColorMenu.value = false;
        showTextureMenu.value = false;
        showSaveOptions.value = false;
      }
    };

    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".color-container") &&
        !event.target.closest(".texture-container") &&
        !event.target.closest(".special-controls")
      ) {
        closeAllMenus();
      }
    };

    // 📌 Функция получения данных для сохранения
    const getSaveMetadata = () => {
      let title = "Unknown Model";

      if (currentModelKey.value) {
        const model = models[currentModelKey.value];
        title = model ? t(model.name) : currentModelKey.value;
      } else if (isThreeDView.value) {
        title = t('models.composition2x2');
      } else if (isMultiModelView.value) {
        title = t('models.composition1x4');
      }

      const dateTime = new Date().toLocaleString();
      const footer = t('special.created');
      const site = "https://couture-metaverse.vercel.app";

      return { title, dateTime, footer, site };
    };

    // Сохранение сцены как JPG (белый фон)
    const saveAsJPG = () => {
      if (!renderer || !scene || !camera) {
        console.error("Ошибка: renderer, scene или camera не инициализированы");
        return;
      }

      // Ждём следующий кадр для гарантии рендера
      requestAnimationFrame(() => {
        renderer.render(scene, camera);
        const canvas = renderer.domElement;
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        // Определение мобильного режима
        const isMobile = window.innerWidth < 768;

        // Коэффициент масштабирования
        const scaleFactor = isMobile ? 1.2 : 1.0;
        let baseFontSize = Math.floor(canvas.width * 0.045 * scaleFactor);
        const smallFontSize = Math.floor(baseFontSize * 0.7);
        let footerFontSize = Math.floor(baseFontSize * 0.6);
        const padding = Math.floor(baseFontSize * 1.1);

        // Система отступов
        const topMargin = padding * (isMobile ? 2.0 : 1.2);
        const titleDateSpacing = padding * (isMobile ? 1.0 : 0.9);
        const footerSiteSpacing = padding * (isMobile ? 0.8 : 0.7);
        const bottomMargin = padding * (isMobile ? 1.0 : 0.5);

        const canvasWidth = canvas.width + padding * 2;
        const canvasHeight = canvas.height + topMargin + titleDateSpacing + footerSiteSpacing + bottomMargin;

        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;

        // Заливка белым фоном
        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, padding, topMargin + titleDateSpacing);

        const { title, dateTime, footer, site } = getSaveMetadata();

        // Функция для динамического подбора размера шрифта
        const adjustFontSize = (text, maxWidth, initialFontSize) => {
          let fontSize = initialFontSize;
          do {
            tempCtx.font = `bold ${fontSize}px Arial`;
            if (tempCtx.measureText(text).width <= maxWidth) {
              return fontSize;
            }
            fontSize--;
          } while (fontSize > 10);
          return fontSize;
        };

        // Подбор размера шрифта для каждого текста
        baseFontSize = adjustFontSize(title, tempCanvas.width * 0.9, baseFontSize);
        footerFontSize = adjustFontSize(footer, tempCanvas.width * 0.9, footerFontSize);
        const siteFontSize = adjustFontSize(site, tempCanvas.width * 0.9, footerFontSize);

        // 📌 Заголовок (зелёный, жирный)
        tempCtx.font = `bold ${baseFontSize}px Arial`;
        tempCtx.fillStyle = "green";
        tempCtx.textAlign = "center";
        tempCtx.fillText(title, tempCanvas.width / 2, topMargin);

        // 📅 Дата (голубая)
        tempCtx.font = `normal ${smallFontSize}px Arial`;
        tempCtx.fillStyle = "dodgerblue";
        tempCtx.fillText(dateTime, tempCanvas.width / 2, topMargin + titleDateSpacing);

        // 🔽 Footer (розовый)
        const footerY = tempCanvas.height - footerSiteSpacing - bottomMargin;
        tempCtx.font = `normal ${footerFontSize}px Arial`;
        tempCtx.fillStyle = "deeppink";
        tempCtx.fillText(footer, tempCanvas.width / 2, footerY);

        // 🌐 Сайт (синий, курсив)
        tempCtx.font = `italic ${siteFontSize}px Arial`;
        tempCtx.fillStyle = "blue";
        tempCtx.fillText(site, tempCanvas.width / 2, footerY + footerSiteSpacing);

        // Сохранение
        const image = tempCanvas.toDataURL("image/jpeg", 0.99);
        const link = document.createElement("a");
        link.href = image;
        link.download = "Model.jpg";
        link.click();

        closeSaveMenu();
      });
    };

    // Сохранение сцены как PNG (прозрачный фон)
    const saveAsPNG = () => {
      if (!renderer || !scene || !camera) {
        console.error("Ошибка: renderer, scene или camera не инициализированы");
        return;
      }

      // Ждём следующий кадр для гарантии рендера
      requestAnimationFrame(() => {
        renderer.render(scene, camera);
        const canvas = renderer.domElement;
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        // Определение мобильного режима
        const isMobile = window.innerWidth < 768;

        // Коэффициент масштабирования
        const scaleFactor = isMobile ? 1.2 : 1.0;
        let baseFontSize = Math.floor(canvas.width * 0.045 * scaleFactor);
        const smallFontSize = Math.floor(baseFontSize * 0.7);
        let footerFontSize = Math.floor(baseFontSize * 0.6);
        const padding = Math.floor(baseFontSize * 1.1);

        // Система отступов
        const topMargin = padding * (isMobile ? 2.0 : 1.2);
        const titleDateSpacing = padding * (isMobile ? 1.0 : 0.9);
        const footerSiteSpacing = padding * (isMobile ? 0.8 : 0.7);
        const bottomMargin = padding * (isMobile ? 1.0 : 0.5);

        const canvasWidth = canvas.width + padding * 2;
        const canvasHeight = canvas.height + topMargin + titleDateSpacing + footerSiteSpacing + bottomMargin;

        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;

        // БЕЗ заливки фона (прозрачный PNG)
        tempCtx.drawImage(canvas, padding, topMargin + titleDateSpacing);

        const { title, dateTime, footer, site } = getSaveMetadata();

        // Функция для динамического подбора размера шрифта
        const adjustFontSize = (text, maxWidth, initialFontSize) => {
          let fontSize = initialFontSize;
          do {
            tempCtx.font = `bold ${fontSize}px Arial`;
            if (tempCtx.measureText(text).width <= maxWidth) {
              return fontSize;
            }
            fontSize--;
          } while (fontSize > 10);
          return fontSize;
        };

        // Подбор размера шрифта для каждого текста
        baseFontSize = adjustFontSize(title, tempCanvas.width * 0.9, baseFontSize);
        footerFontSize = adjustFontSize(footer, tempCanvas.width * 0.9, footerFontSize);
        const siteFontSize = adjustFontSize(site, tempCanvas.width * 0.9, footerFontSize);

        // 📌 Заголовок (зелёный, жирный)
        tempCtx.font = `bold ${baseFontSize}px Arial`;
        tempCtx.fillStyle = "green";
        tempCtx.textAlign = "center";
        tempCtx.fillText(title, tempCanvas.width / 2, topMargin);

        // 📅 Дата (голубая)
        tempCtx.font = `normal ${smallFontSize}px Arial`;
        tempCtx.fillStyle = "dodgerblue";
        tempCtx.fillText(dateTime, tempCanvas.width / 2, topMargin + titleDateSpacing);

        // 🔽 Footer (розовый)
        const footerY = tempCanvas.height - footerSiteSpacing - bottomMargin;
        tempCtx.font = `normal ${footerFontSize}px Arial`;
        tempCtx.fillStyle = "deeppink";
        tempCtx.fillText(footer, tempCanvas.width / 2, footerY);

        // 🌐 Сайт (синий, курсив)
        tempCtx.font = `italic ${siteFontSize}px Arial`;
        tempCtx.fillStyle = "blue";
        tempCtx.fillText(site, tempCanvas.width / 2, footerY + footerSiteSpacing);

        // Сохранение в PNG
        const image = tempCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = "Model.png";
        link.click();

        closeSaveMenu();
      });
    };

    // Сохранение сцены как PDF
    const saveAsPDF = async () => {
      if (!renderer || !scene || !camera) {
        console.error("Ошибка: renderer, scene или camera не инициализированы");
        return;
      }

      // Функция для загрузки шрифта
      const loadFont = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Не удалось загрузить шрифт: ${response.statusText}`);
        }
        return await response.arrayBuffer();
      };

      // Загрузка всех необходимых шрифтов
      let fontRegularBuffer, fontMediumBuffer, fontItalicBuffer;
      try {
        // fontRegularBuffer = await loadFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf');
        // fontMediumBuffer = await loadFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf');
        // fontItalicBuffer = await loadFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf');
        fontRegularBuffer = await loadFont('/assets/fonts/Roboto-Regular.ttf');
        fontMediumBuffer  = await loadFont('/assets/fonts/Roboto-Medium.ttf');
        fontItalicBuffer  = await loadFont('/assets/fonts/Roboto-Italic.ttf');
      } catch (error) {
        console.error("Ошибка загрузки шрифта:", error);
        alert("Не удалось загрузить шрифт для PDF");
        return;
      }

      // Конвертация шрифтов в Base64
      const fontRegularBase64 = btoa(
        new Uint8Array(fontRegularBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const fontMediumBase64 = btoa(
        new Uint8Array(fontMediumBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const fontItalicBase64 = btoa(
        new Uint8Array(fontItalicBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      renderer.render(scene, camera);
      const canvas = renderer.domElement;
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");

      // Расчёт размеров с отступами (как в JPG)
      const isMobile = window.innerWidth < 768;
      const scaleFactor = isMobile ? 1.2 : 1.0;

      let baseFontSize = Math.floor(canvas.width * 0.045 * scaleFactor);
      const smallFontSize = Math.floor(baseFontSize * 0.7);
      let footerFontSize = Math.floor(baseFontSize * 0.6);
      const padding = Math.floor(baseFontSize * 1.1);

      const topMargin = padding * (isMobile ? 2.0 : 1.2);
      const titleDateSpacing = padding * (isMobile ? 1.0 : 0.9);
      const footerSiteSpacing = padding * (isMobile ? 0.8 : 0.7);
      const bottomMargin = padding * (isMobile ? 1.0 : 0.5);

      const canvasWidth = canvas.width + padding * 2;
      const canvasHeight = canvas.height + topMargin + titleDateSpacing + footerSiteSpacing + bottomMargin;

      tempCanvas.width = canvasWidth;
      tempCanvas.height = canvasHeight;

      // Заливаем фон белым
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Копируем сцену
      ctx.drawImage(canvas, padding, topMargin + titleDateSpacing);

      // Конвертируем в JPEG (99% качество)
      const image = tempCanvas.toDataURL("image/jpeg", 0.99);

      // Создаём PDF с размерами идентичными JPG
      const pxToMm = 0.264583;
      const pdfWidth = canvasWidth * pxToMm;
      const pdfHeight = canvasHeight * pxToMm;

      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      // Регистрация шрифтов в jsPDF
      pdf.addFileToVFS('Roboto-Regular.ttf', fontRegularBase64);
      pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

      pdf.addFileToVFS('Roboto-Medium.ttf', fontMediumBase64);
      pdf.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');

      pdf.addFileToVFS('Roboto-Italic.ttf', fontItalicBase64);
      pdf.addFont('Roboto-Italic.ttf', 'Roboto', 'italic');

      pdf.setFont('Roboto', 'normal');

      const { title, dateTime, footer, site } = getSaveMetadata();

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Вставка изображения на всю страницу
      pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight);

      // Функция для динамического подбора размера шрифта
      const adjustFontSize = (text, maxWidth, initialFontSize) => {
        let fontSize = initialFontSize;
        do {
          pdf.setFontSize(fontSize);
          if (pdf.getTextWidth(text) <= maxWidth) {
            return fontSize;
          }
          fontSize--;
        } while (fontSize > 10);
        return fontSize;
      };

      // Конвертация размеров шрифтов из пикселей в пункты
      const pxToPt = 0.75;

      // Подбор оптимальных размеров шрифтов
      const finalBaseFontSize = adjustFontSize(title, pageWidth * 0.9, baseFontSize * pxToPt);
      const finalSmallFontSize = smallFontSize * pxToPt;
      const finalFooterFontSize = adjustFontSize(footer, pageWidth * 0.9, footerFontSize * pxToPt);
      const finalSiteFontSize = adjustFontSize(site, pageWidth * 0.9, footerFontSize * pxToPt);

      // Конвертация отступов в миллиметры
      const topMarginMm = topMargin * pxToMm;
      const titleDateSpacingMm = titleDateSpacing * pxToMm;
      const footerSiteSpacingMm = footerSiteSpacing * pxToMm;
      const bottomMarginMm = bottomMargin * pxToMm;

      // Добавление текстовых элементов

      // 📌 Заголовок (зелёный, жирный - Roboto Medium)
      pdf.setFont('Roboto', 'bold');
      pdf.setFontSize(finalBaseFontSize);
      pdf.setTextColor(0, 128, 0);
      pdf.text(title, pageWidth / 2, topMarginMm, { align: "center" });

      // 📅 Дата и время (голубая, обычная)
      pdf.setFont('Roboto', 'normal');
      pdf.setFontSize(finalSmallFontSize);
      pdf.setTextColor(30, 144, 255);
      pdf.text(dateTime, pageWidth / 2, topMarginMm + titleDateSpacingMm, { align: "center" });

      // 🔽 Footer текст (розовый, обычная)
      const footerY = pageHeight - footerSiteSpacingMm - bottomMarginMm;
      pdf.setFont('Roboto', 'normal');
      pdf.setFontSize(finalFooterFontSize);
      pdf.setTextColor(255, 105, 180);
      pdf.text(footer, pageWidth / 2, footerY, { align: "center" });

      // 🌐 Сайт (синий, курсив)
      pdf.setFont("Roboto", "italic");
      pdf.setTextColor(0, 0, 255);
      pdf.setFontSize(finalSiteFontSize);
      pdf.text(site, pageWidth / 2, footerY + footerSiteSpacingMm, { align: "center" });

      // Сохранение PDF файла
      pdf.save("Model.pdf");

      closeSaveMenu();
    };

    // Переменные для записи видео
    let mediaRecorder = null;
    let recordedChunks = [];
    let animationFrameId = null;

    // Начать запись видео
    const startRecording = () => {
      if (!renderer || !scene || !camera) {
        console.error("Ошибка: renderer, scene или camera не инициализированы");
        return;
      }

      const canvas = renderer.domElement;

      // Расчёт размеров с учётом текста и отступов (как в JPG)
      const isMobile = window.innerWidth < 768;
      const scaleFactor = isMobile ? 1.2 : 1.0;

      let baseFontSize = Math.floor(canvas.width * 0.045 * scaleFactor);
      const smallFontSize = Math.floor(baseFontSize * 0.7);
      let footerFontSize = Math.floor(baseFontSize * 0.6);
      const padding = Math.floor(baseFontSize * 1.1);

      const topMargin = padding * (isMobile ? 2.0 : 1.2);
      const titleDateSpacing = padding * (isMobile ? 1.0 : 0.9);
      const footerSiteSpacing = padding * (isMobile ? 0.8 : 0.7);
      const bottomMargin = padding * (isMobile ? 1.0 : 0.5);

      // Создание canvas с правильными размерами (включая текст)
      const streamCanvas = document.createElement("canvas");
      const streamCtx = streamCanvas.getContext("2d");
      streamCanvas.width = canvas.width + padding * 2;
      streamCanvas.height = canvas.height + topMargin + titleDateSpacing + footerSiteSpacing + bottomMargin;

      // Создание видео-потока из canvas (60 FPS)
      const stream = streamCanvas.captureStream(60);

      // Функция отрисовки каждого кадра видео
      const drawFrame = () => {
        // Рендерим сцену
        renderer.render(scene, camera);

        // Заливка белым фоном
        streamCtx.fillStyle = "white";
        streamCtx.fillRect(0, 0, streamCanvas.width, streamCanvas.height);

        // Копируем 3D сцену с отступами (как в JPG)
        streamCtx.drawImage(canvas, padding, topMargin + titleDateSpacing);

        const { title, dateTime, footer, site } = getSaveMetadata();

        // Функция для динамического подбора размера шрифта
        const adjustFontSize = (text, maxWidth, initialFontSize) => {
          let fontSize = initialFontSize;
          do {
            streamCtx.font = `bold ${fontSize}px Arial`;
            if (streamCtx.measureText(text).width <= maxWidth) {
              return fontSize;
            }
            fontSize--;
          } while (fontSize > 10);
          return fontSize;
        };

        // Подбор размера шрифта для каждого текста
        baseFontSize = adjustFontSize(title, streamCanvas.width * 0.9, baseFontSize);
        footerFontSize = adjustFontSize(footer, streamCanvas.width * 0.9, footerFontSize);
        const siteFontSize = adjustFontSize(site, streamCanvas.width * 0.9, footerFontSize);

        // 📌 Заголовок (зелёный, жирный)
        streamCtx.font = `bold ${baseFontSize}px Arial`;
        streamCtx.fillStyle = "green";
        streamCtx.textAlign = "center";
        streamCtx.fillText(title, streamCanvas.width / 2, topMargin);

        // 📅 Дата (голубая)
        streamCtx.font = `normal ${smallFontSize}px Arial`;
        streamCtx.fillStyle = "dodgerblue";
        streamCtx.fillText(dateTime, streamCanvas.width / 2, topMargin + titleDateSpacing);

        // 🔽 Footer (розовый)
        const footerY = streamCanvas.height - footerSiteSpacing - bottomMargin;
        streamCtx.font = `normal ${footerFontSize}px Arial`;
        streamCtx.fillStyle = "deeppink";
        streamCtx.fillText(footer, streamCanvas.width / 2, footerY);

        // 🌐 Сайт (синий, курсив)
        streamCtx.font = `italic ${siteFontSize}px Arial`;
        streamCtx.fillStyle = "blue";
        streamCtx.fillText(site, streamCanvas.width / 2, footerY + footerSiteSpacing);

        // Продолжаем запись следующего кадра
        animationFrameId = requestAnimationFrame(drawFrame);
      };

      // Определение поддерживаемого формата видео
      let mimeType;
      let isMP4 = false;

      // Проверка Safari (предпочитаем MP4)
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isSafari && MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
        isMP4 = true;
        console.log("🍎 Safari обнаружен! Используем MP4.");
      } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9")) {
        mimeType = "video/webm; codecs=vp9";
      } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp8")) {
        mimeType = "video/webm; codecs=vp8";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
        isMP4 = true;
      } else {
        console.error("⛔ Ваш браузер не поддерживает запись видео.");
        alert("Запись видео не поддерживается в этом браузере");
        return;
      }

      // Создание MediaRecorder для записи потока
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      } catch (error) {
        console.error("Ошибка создания MediaRecorder:", error);
        alert("Не удалось начать запись видео");
        return;
      }

      // Обработчик получения данных
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // Обработчик завершения записи
      mediaRecorder.onstop = () => saveVideo(isMP4);

      // Очистка буфера
      recordedChunks = [];

      // ЖДЁМ один кадр, чтобы canvas гарантированно отрендерился
      requestAnimationFrame(() => {
        // Отрисовываем первый кадр (с кубиком!)
        drawFrame();

        // Ждём ещё один кадр для надёжности
        requestAnimationFrame(() => {
          // Теперь запускаем запись - первый кадр уже готов!
          mediaRecorder.start();
          isRecording.value = true;

          console.log(`🎥 Запись видео началась! Формат: ${isMP4 ? 'MP4' : 'WebM'}`);
        });
      });
    };

    // Остановка записи
    const stopRecording = () => {
      // Остановка MediaRecorder
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }

      // Остановка отрисовки кадров
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // Обновление состояния
      isRecording.value = false;

      console.log("🛑 Запись видео остановлена!");

      closeSaveMenu();
    };

    // Сохранение видео
    const saveVideo = (isMP4Format) => {
      // Проверка наличия записанных данных
      if (recordedChunks.length === 0) {
        console.warn("⚠️ Нет записанных данных!");
        return;
      }

      // Определение типа видео и расширения
      const mimeType = isMP4Format ? "video/mp4" : "video/webm";
      const extension = isMP4Format ? "mp4" : "webm";

      // Создание Blob из записанных фрагментов
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Создание ссылки для скачивания
      const link = document.createElement("a");
      link.href = url;
      link.download = `Model.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Освобождение памяти
      URL.revokeObjectURL(url);
      recordedChunks = [];

      console.log(`💾 Видео сохранено как Model.${extension}!`);
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
      document.addEventListener("click", handleClickOutside);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener("click", handleClickOutside);

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
      t, isFooterHidden, toggleFooter, canvasContainer,
      models, loadModel, loadAllModels, loadAllModels3d, isMultiModelView, isThreeDView,
      uploadTexture, changeColor, changeColorFromPicker, changeTexture,
      toggleMixing, isMixingEnabled,
      resetModelSettings, clearLocalStorage,
      rotateClockwise, rotateCounterClockwise, pauseRotation, stopRotation, rotate180,
      showSaveOptions, toggleSaveMenu, saveAsJPG, saveAsPNG, saveAsPDF, startRecording, stopRecording, isRecording,
      toggleColorMenu, toggleTextureMenu, showColorMenu, showTextureMenu, closeColorMenu, closeTextureMenu, closeAllMenus,
    };
  },
};
</script>

<template>
  <div class="container">
    <h1>
      {{ $t('project2.name') }}
      <CanvasFullScreen :canvasContainer="canvasContainer"></CanvasFullScreen> <ToggleFullScreen></ToggleFullScreen> <button
      @click="toggleFooter" class="toggle-footer-btn" :title="isFooterHidden ? t('special.openFooter') : t('special.closeFooter')"><i
      :class="isFooterHidden ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i></button>
    </h1>
    <line></line>
    <div class="scene-container" ref="canvasContainer"></div>

    <!-- Кнопки управления моделями -->
    <div class="model-selection">
      <img :src="models.menShirt1.icon" :alt="t('models.menShirt1')" @click="loadModel('menShirt1')" class="button" :title="t('models.menShirt1')">
      <img :src="models.womenShirt.icon" :alt="t('models.womenShirt')" @click="loadModel('womenShirt')" class="button" :title="t('models.womenShirt')">
      <img :src="models.menShirt2.icon" :alt="t('models.menShirt2')" @click="loadModel('menShirt2')" class="button" :title="t('models.menShirt2')">
      <img :src="models.womenDress.icon" :alt="t('models.womenDress')" @click="loadModel('womenDress')" class="button" :title="t('models.womenDress')">
      <button @click="loadAllModels" class="load-all-btn" :title="t('models.composition1x4')"><i class="fas fa-th-large"></i></button>
      <button @click="loadAllModels3d" class="load-all-btn" :title="t('models.composition2x2')"><i class="fas fa-cubes"></i></button>
      <button v-if="!isMultiModelView && !isThreeDView" @click="clearLocalStorage" class="delete" :title="t('special.delete')"><i class="fas fa-broom"></i></button>
    </div>

    <!-- Кнопки управления вращением -->
    <div class="rotation-controls">
      <button @click="rotateClockwise" :title="t('rotating.clockwise')"><i class="fas fa-arrow-rotate-right"></i></button>
      <button @click="pauseRotation" :title="t('rotating.pause')"><i class="fas fa-pause"></i></button>
      <button @click="stopRotation" :title="t('rotating.stop')"><i class="fas fa-stop"></i></button>
      <button @click="rotate180" :title="t('rotating.180')"><i class="fas fa-sync-alt"></i></button>
      <button @click="rotateCounterClockwise" :title="t('rotating.counterclockwise')"><i class="fas fa-arrow-rotate-left"></i></button>
    </div>

    <div class="model-controls" v-if="!isMultiModelView && !isThreeDView">

    <!-- Кнопка и выезжающее меню для выбора цвета -->
      <div class="color-container">
        <button @click="toggleColorMenu" :title="showColorMenu ? t('changeColor.closeColorMenu') : t('changeColor.openColorMenu')" class="color-main" :class="{'active': showColorMenu}"><i class="fas fa-palette"></i></button>

        <!-- Анимированное выезжающее меню -->
        <transition name="slide">
          <div v-show="showColorMenu" class="color-controls" :class="{'show': showColorMenu}">
            <button @click="changeColor(0xfbc6c6); closeColorMenu()" :title="t('changeColor.red')" class="color-button" style="background-color: #fbc6c6;"></button>
            <button @click="changeColor(0xc6fbc6); closeColorMenu()" :title="t('changeColor.green')" class="color-button" style="background-color: #c6fbc6;"></button>
            <button @click="changeColor(0xd0d0fb); closeColorMenu()" :title="t('changeColor.blue')" class="color-button" style="background-color: #d0d0fb;"></button>
            <button @click="changeColor(0xffffff); closeColorMenu()" :title="t('changeColor.white')" class="color-button" style="background-color: #ffffff;"></button>
            <button @click="changeColor(0xfaeeb2); closeColorMenu()" :title="t('changeColor.golden')" class="color-button" style="background-color: #faeeb2;"></button>
          </div>
        </transition>
      </div>

      <div class="color-other">
        <input type="color" @input="changeColorFromPicker" @click="closeAllMenus()" :title="t ('changeColor.picker')" class="color-button color-picker"/>
      </div>

      <!-- Кнопка и выезжающее меню для выбора текстуры -->
      <div class="texture-container">
        <button @click="toggleTextureMenu" :title="showTextureMenu ? t('texture.closeTextureMenu') : t('texture.openTextureMenu')" class="texture-main" :class="{'active': showTextureMenu}"><i class="fas fa-images"></i></button>

        <transition name="slide">
          <div v-show="showTextureMenu" class="texture-controls" :class="{'show': showTextureMenu}">
            <img src="/assets/textures/texture1.webp" alt="texture1" @click="changeTexture('texture1'); closeTextureMenu()" class="button" :title="t('texture.texture1')">
            <img src="/assets/textures/texture2.webp" alt="texture2" @click="changeTexture('texture2'); closeTextureMenu()" class="button" :title="t('texture.texture2')">
            <img src="/assets/textures/texture3.webp" alt="texture3" @click="changeTexture('texture3'); closeTextureMenu()" class="button" :title="t('texture.texture3')">
            <img src="/assets/textures/texture4.webp" alt="texture4" @click="changeTexture('texture4'); closeTextureMenu()" class="button" :title="t('texture.texture4')">
            <img src="/assets/textures/texture5.webp" alt="texture5" @click="changeTexture('texture5'); closeTextureMenu()" class="button" :title="t('texture.texture5')">
          </div>
        </transition>
      </div>

      <div class="texture-other">
        <!-- Кнопка для загрузки текстуры с диска -->
        <input type="file" @change="uploadTexture" id="file-input" class="file-input">
        <label for="file-input" class="button upload" :title="t('texture.upload')"><i class="fa-solid fa-upload"></i></label>
        <!-- Кнопка сброса -->
        <button @click="resetModelSettings(); closeAllMenus()" class="button reset" :title="t('texture.resetAll')"><i class="fas fa-reply"></i></button>
        <!-- Кнопка для включения/отключения смешивания -->
        <button @click="toggleMixing(); closeAllMenus()" :title="isMixingEnabled ? t('rotating.mixYes') : t('rotating.mixNo')" class="mixing" :class="{'active': isMixingEnabled}"><i :class="isMixingEnabled ? 'fas fa-sliders-h' : 'fas fa-gem'"></i></button>
      </div>
    </div>

    <!-- Кнопка "Сохранить" и раскрывающееся меню -->
    <div class="special-controls">
      <!-- Основная кнопка -->
      <button @click="toggleSaveMenu" :title="showSaveOptions ? t('special.saving.closeSaveData') : t('special.saving.saveData')" class="save-button" :class="{'active': showSaveOptions}"><i class="fas fa-save"></i></button>

      <!-- Анимация для раскрывающегося меню -->
      <transition name="save-options">
        <div v-show="showSaveOptions" class="save-options">
          <button @click="saveAsJPG" :title="t('special.saving.saveJPG')"><i class="fas fa-camera"></i></button>
          <button @click="saveAsPNG" :title="t('special.saving.savePNG')"><i class="fas fa-file-image"></i></button>
          <button @click="saveAsPDF" :title="t('special.saving.savePDF')"><i class="fas fa-file-pdf"></i></button>
          <button v-show="!isRecording" @click="startRecording" :title="t('special.saving.startVideo')" class="film-start"><i class="fas fa-film"></i></button>
          <button v-show="isRecording" @click="stopRecording" :title="t('special.saving.stopVideo')" class="film-stop"><i class="fas fa-stop-circle"></i></button>
        </div>
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@mixin btn($width: 50px, $height: 50px, $fs: 24px) {
  width: $width;
  height: $height;
  font-size: $fs;
  border: none;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.9);
  transition: ease-in-out, border .2s, background-color .2s, box-shadow .2s;

  @media (max-width: 1020px) {
    width: calc(#{$width} - 5px);
    height: calc(#{$height} - 5px);
    font-size: calc(#{$fs} - 2px);
  }

  @media (max-width: 768px) {
    width: calc(#{$width} - 10px);
    height: calc(#{$height} - 10px);
    font-size: calc(#{$fs} - 6px);
  }
}

@mixin img-style {
  width: 100%; /* Ширина изображения соответствует ширине контейнера */
  height: 100%; /* Высота изображения соответствует высоте контейнера */
  object-fit: cover; /* Сохраняет пропорции изображения и заполняет контейнер */
  display: block; /* Убирает нижний отступ у изображений */
}

.container {
  flex: 1 0 auto;
  background: linear-gradient(to bottom, rgb(229, 251, 255), rgb(255, 240, 244)) no-repeat center;

  h1 {
    font-size: 2.5rem;
    margin: 0.7rem auto;
    color: black;
    .toggle-footer-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-size: 2.5rem;
      color: mediumseagreen;
    }
    .toggle-footer-btn:hover {color: goldenrod;}
  }

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
    gap: 15px;

    .button {
      @include btn; // Используем значения по умолчанию
      color: white;
      border: 1px solid grey;
      overflow: hidden; /* Скрываем части изображения, выходящие за границы контейнера */

      &:hover {
        //background-color: #2cbd03; /* Более яркий цвет при наведении */
        border: 1px solid darkgrey;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      img {@include img-style;} // Стили для img подключены
    }

    .load-all-btn {
      @include btn;
      background: #6f1f8e;
      color: white;
      font-size: 24px;

      .fas {color: white;}
    }

    .load-all-btn:hover {
      .fas {color: gold;}
      background: royalblue;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .delete {
      @include btn; // Используем значения по умолчанию
      color: black;
      background-color: #ffea00;

      &:hover {
        background-color: #ffffff; /* Более яркий цвет при наведении */
        color: deeppink;
        border: 2px solid deeppink;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
    }
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
      @include btn; // Используем значения по умолчанию
      color: white;
      background-color: #87ceeb;

      &:hover {
        background-color: #00bfff; /* Более яркий цвет при наведении */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .model-controls {
    position: absolute;
    left: 40px;
    top: 55%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 10px;

    .color-container,
    .texture-container {
      position: relative;
      display: flex;
      align-items: center;

      .color-main, .texture-main {
        @include btn; // Используем значения по умолчанию
        background: darkblue;
        color: white;

        &.active {background-color: darkgreen;}
        &:hover {box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);}
      }

      .color-controls, .texture-controls {
        position: absolute;
        left: 60px; /* Отступ вправо от основной кнопки */
        display: flex;
        gap: 10px;
        opacity: 0;
        transform: translateX(-20px);
        transition: opacity 0.3s ease-out, transform 0.3s ease-out;

        img {@include img-style;} // Стили для img подключены

        &.show {
          opacity: 1;
          transform: translateX(0);
        }

        .color-button, .button {
          @include btn; // Используем значения по умолчанию

          &:hover {box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);}
        }
      }
    }
    /* Анимация для Vue Transition */
    .slide-enter-from, .slide-leave-to {
      opacity: 0;
      transform: translateX(-20px);
    }

    .slide-enter-to, .slide-leave-from {
      opacity: 1;
      transform: translateX(0);
    }

    .slide-enter-active, .slide-leave-active {
      transition: opacity 0.3s ease-out, transform 0.3s ease-out;
    }

    .color-other {
      display: flex;
      flex-direction: column;

      .color-button {
        @include btn; // Используем значения по умолчанию

        &:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      }

      .color-picker {
        padding: 0;
        border-radius: 5px;
      }
    }

    .texture-other {
      display: flex;
      flex-direction: column;

      .button {
        @include btn; // Используем значения по умолчанию
        margin-bottom: 10px;
        overflow: hidden; /* Скрываем части изображения, выходящие за границы контейнера */

        .fa-solid, .fa-brands, .fas {font-size: 24px;}

        &:hover {box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);}

        img {@include img-style;} // Стили для img подключены
      }

      .upload {
        @include btn; // Используем значения по умолчанию
        color: white;
        margin-bottom: 10px;
        background-color: dodgerblue;

        &:hover {
          background-color: darkgreen;
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
        @include btn; // Используем значения по умолчанию
        color: white;
        background-color: red;

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

          i {
            transform: rotate(180deg); /* При активном состоянии иконка может анимированно поворачиваться */
          }
        }
      }
    }
  }

  .special-controls {
    position: absolute;
    top: 50%;
    right: 40px;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;

    .save-button {
      @include btn;
      margin-bottom: 10px;
      background: dodgerblue;
      color: white;

      &:hover {box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);}
      &.active {background-color: darkgreen;}
    }

    .save-options {
      display: flex;
      flex-direction: column;
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.4s ease, transform 0.4s ease;

      button {
        @include btn;
        margin-bottom: 10px;
        background: lightgoldenrodyellow;

        &:hover {
          background-color: #ffffff;
          color: darkgreen;
          border: 2px solid darkgreen;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        &.film-start:hover {
          color: purple;
          border-color: purple;
        }

        &.film-stop:hover {
          color: red;
          border-color: red;
        }
      }
    }

    // Анимация входа
    .save-options-enter-from {
      opacity: 0;
      transform: translateY(-10px);
    }

    .save-options-enter-to {
      opacity: 1;
      transform: translateY(0);
    }

    .save-options-enter-active {
      transition: opacity 0.6s ease, transform 0.6s ease;
    }

    // Анимация выхода
    .save-options-leave-from {
      opacity: 1;
      transform: translateY(0);
    }

    .save-options-leave-to {
      opacity: 0;
      transform: translateY(-10px);
    }

    .save-options-leave-active {
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
  }
}
@media(max-width: 1020px) {
  .container {
    h1 {
      font-size: 2.3rem;
      margin: 0.6rem auto;

      .toggle-footer-btn {font-size: 2.3rem;}
    }

    .model-selection {
      top: 165px;
      gap: 15px;

      .button {
        @include btn;
        border: 1px solid grey;
      }

      .load-all-btn {display: none;}

      .delete {@include btn;}
    }

    .rotation-controls {
      bottom: 80px;
      gap: 15px;

      button {@include btn;}
    }

    .model-controls {
      left: 22px;
      top: 54%;
      gap: 9px;

      .color-container,
      .texture-container {

        .color-main, .texture-main {@include btn;}

        .color-controls, .texture-controls {
          left: 55px; /* Отступ вправо от основной кнопки */
          gap: 9px;

          .color-button, .button {@include btn;}
        }
      }

      .color-other {
        .color-button {@include btn;}
      }

      .texture-other {
        .button {
          @include btn;
          margin-bottom: 9px;
          .fa-solid, .fa-brands, .fas {font-size: 22px;}
        }

        .upload {
          @include btn;
          margin-bottom: 9px;
        }

        .mixing {@include btn;}
      }
    }

    .special-controls {
      right: 22px; /* Размещение кнопок справа */
      top: 54%;

      .save-button {
        @include btn;
        margin-bottom: 9px;
      }

      .save-options {
        button {
          @include btn;
          margin-bottom: 9px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .container {
    h1 {
      font-size: 1.9rem;
      margin: 0.5rem auto;

      .toggle-footer-btn {font-size: 1.9rem;}
    }

    .model-selection {
      top: 150px;
      gap: 10px;

      .button {
        @include btn;
        border: 1px solid grey;
      }

      .load-all-btn {display: none;}

      .delete {@include btn;}
    }

    .rotation-controls {
      bottom: 20px;
      gap: 10px;

      button {@include btn;}
    }

    .model-controls {
      left: 20px;
      top: 59%;
      gap: 8px;

      .color-container,
      .texture-container {

        .color-main, .texture-main {@include btn;}

        .color-controls, .texture-controls {
          left: 50px; /* Отступ вправо от основной кнопки */
          gap: 8px;

          .color-button, .button {@include btn;}
        }
      }

      .color-other {
        .color-button {@include btn;}
      }

      .texture-other {
        .button {
          @include btn;
          margin-bottom: 8px;
          .fa-solid, .fa-brands, .fas {font-size: 18px;}
        }

        .upload {
          @include btn;
          margin-bottom: 8px;
        }

        .mixing {@include btn;}
      }
    }

    .special-controls {
      right: 20px; /* Размещение кнопок справа */
      top: 59%;

      .save-button {
        @include btn;
        margin-bottom: 8px;
      }

      .save-options {
        button {
          @include btn;
          margin-bottom: 8px;
        }
        .film-start {display: none;}
        .film-stop {display: none;}
      }
    }
  }
}
</style>
