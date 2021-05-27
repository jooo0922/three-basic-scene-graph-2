'use strict';

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

function main() {
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas
  });
  renderer.setClearColor(0xAAAAAA); // WebGLRenderer.clearColor()이 색상 버퍼를 지워주는 것인데, 이것이 다 지워진 후의 초기 색상값을 지정해주는 메소드 같음.
  renderer.shadowMap.enabled = true; // 해당 WebGLRenderer의 scene에서 빛에 의한 그림자를 렌더링할 수 있게 하느냐 마느냐를 boolean으로 정한 것 같음. shadow는 나중에 배울 거임.

  // camera
  // 카메라를 여러 위치에 생성해야하므로, 각 위치에 맞는 fov값을 받아서 perspective camera를 생성함.
  function makeCamera(fov = 40) {
    const aspect = 2;
    const zNear = 0.1;
    const zFar = 1000;
    return new THREE.PerspectiveCamera(fov, aspect, zNear, zFar);
  }
  const camera = makeCamera();
  camera.position.set(8, 4, 10).multiplyScalar(3); // 얘는 (8, 4, 10)이라는 3D 공간상의 벡터에 3이라는 상수(스칼라량)으로 곱해서 (24, 12, 30)으로 만드는 것.
  // 그니까 한마디로 camera를 (24, 12, 30)위치에 갖다놓겠다는 거잖아.
  camera.lookAt(0, 0, 0); // 이거는 위치를 이동시킨 카메라가 원점을 바라보게 회전시키는 거겠지?

  const scene = new THREE.Scene();

  // light
  {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 20, 0);
    scene.add(light);
    light.castShadow = true; // 기본값은 false. true로 하면 해당 light에 의한 역동적인 그림자를 렌더해줌.
    // DirectionalLight.shadow는 Orthographic camera(공간감, 원근 없이 표현되는 카메라. perspective camera와 반대)를 사용하여 그림자를 계산함.
    // light.shadow.camera는 scene에 depth map을 생성하는 데 사용된다고 함. scene에서 그림자를 표현하는 공간? 을 depth map이라고 하는 거 같음.
    // light.shadow.map은 위의 카메라에 의해 생성된 depth map을 가리킴. pixel depth를 벗어난 위치는 그림자로 렌더링된다고 함.
    // light.shadow.mapSize는 map의 사이즈를 결정함. 값이 클수록 계산 시간은 오래 걸리지만 그림자의 퀄리티가 상승한다고 함. 2의 거듭제곱값만 받음. 기본값은 (512, 512).
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    // DirectionalLight.shadow.camera의 기본값은 원점을 중심으로 왼쪽 및 아래쪽은 -5, 오른쪽 및 위쪽은 5로 크기를 가지는 Orthographic camera이고, near는 0.5, far은 500이다.
    // 여기서는 크기, near, far값을 바꿔주는 것.
    const d = 50;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 50;
    // 위에 light.shadow.map에 대한 설명에서 pixel depth를 지정하는 값인 거 같음. 
    // 이 값을 넘어가는 부분은 그림자로 계산하는 거 같음. 기본값은 0이고, 0.0001씩 더해줘야 인공적인 느낌을 줄어든다고 함.
    light.shadow.bias = 0.001;
  }

  // 같은 light를 또 생성해서 다른 곳에 위치시킴.
  {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 2, 4);
    scene.add(light);
  }

  // 탱크가 돌아다닐 바닥 메쉬를 생성함.
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: 0xCC8866
  });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = Math.PI * -0.5; // plane을 -90도만큼 회전시킴.
  groundMesh.receiveShadow = true; // 이 메쉬에 그림자가 표현되도록 허용하는 값인 거 같음.
  scene.add(groundMesh);

  // 씬 그래프 상에서 탱크와 관련된 여러 요소들을 담아놓을 부모 노드
  const tank = new THREE.Object3D();
  scene.add(tank);

  // 탱크의 직육면체 몸통 부분의 mesh를 생성함
  const carWidth = 4;
  const carHeight = 1;
  const carLength = 8;
  const bodyGeometry = new THREE.BoxGeometry(carWidth, carHeight, carLength);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x6688AA
  });
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  bodyMesh.position.y = 1.4; // 자동차 바퀴에 의해 바닥에서 살짝 띄워져야겠지?
  bodyMesh.castShadow = true; // 이 메쉬에 의해 그림자를 생성하도록 허용한 거겠지
  tank.add(bodyMesh); // tank의 자식노드로 할당함

  // bodyMesh에 붙여서 bodyMesh의 움직임을 따라다닐 perspective camera를 생성하고, bodyMesh의 자식노드로 할당함.
  const tankCameraFov = 75;
  const tankCamera = makeCamera(tankCameraFov);
  tankCamera.position.y = 3;
  tankCamera.position.z = -6; // 이 position은 bodyMesh를 기준으로 설정하는 거겠지?
  tankCamera.rotation.y = Math.PI // y축으로 180도 회전이니까 카메라가 원래의 반대 방향을 향하도록 한거임.
  bodyMesh.add(tankCamera);

  // bodyMesh에 자식노드로 할당해 줄 wheelMesh 6개가 담긴 wheelMeshes 배열을 만듦.
  const wheelRadius = 1;
  const wheelThickness = 0.5;
  const wheelSegments = 6;
  const wheelGeometry = new THREE.CylinderGeometry(
    wheelRadius, // top radius 
    wheelRadius, // bottom radius
    wheelThickness, // height of cylinder
    wheelSegments);
  const wheelMaterial = new THREE.MeshPhongMaterial({
    color: 0x888888
  });
  const wheelPositions = [
    [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, carLength / 3],
    [carWidth / 2 + wheelThickness / 2, -carHeight / 2, carLength / 3],
    [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, 0],
    [carWidth / 2 + wheelThickness / 2, -carHeight / 2, 0],
    [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, -carLength / 3],
    [carWidth / 2 + wheelThickness / 2, -carHeight / 2, -carLength / 3],
  ]; // 각각의 배열 안에 담긴 6개의 배열은 각각의 wheelMesh.position.x, y, z에 할당해줄 값들이 담겨있음.
  const wheelMeshes = wheelPositions.map((position) => {
    const mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
    mesh.position.set(...position); // 전개연산자(...)를 이용해서 position 배열 하나에 들어있는 3개의 값을 각각 mesh.position.set()의 x,y,z에 각각 할당해 줌.
    mesh.rotation.z = Math.PI * 0.5; // 각각의 wheelMesh를 z축 방향으로 90도만큼 회전하면? 세로로 서있는 형태의 바퀴가 되겠지?
    mesh.castShadow = true; // 이 메쉬에 의해 그림자를 생성하도록 허용.
    bodyMesh.add(mesh) // 바퀴들을 bodyMesh의 자식노드로 추가
    return mesh; // map은 배열 내의 모든 요소에 주어진 콜백함수를 호출시켜 얻어낸 결과로 새로운 배열을 생성하므로, 그 결과값을 return해준 거겠지?
  });

  // bodyMesh 위에 붙일 반구형 메쉬를 만듦.
  const domeRadius = 2;
  const domeWidthSubdivisions = 12;
  const domeHeightSubdivisions = 12;
  const domePhiStart = 0; // 0도
  const domePhiEnd = Math.PI * 2 // 360도
  const domeThetaStart = 0; // 0도
  const domeThetaEnd = Math.PI * 0.5 // 90도
  // three.js 공식 튜토리얼의 원시모델을 설명하는 부분에서 sphere geometry 부분을 보면, 위와 같이 각도들을 지정해줘야 반구형으로 렌더될 수 있음.
  const domeGeometry = new THREE.SphereGeometry(
    domeRadius, domeWidthSubdivisions, domeHeightSubdivisions,
    domePhiStart, domePhiEnd, domeThetaStart, domeThetaEnd
  );
  const domeMesh = new THREE.Mesh(domeGeometry, bodyMaterial); // 돔 메쉬는 바디 메쉬와 동일한 material로 생성함.
  domeMesh.castShadow = true; // 이 메쉬에 의한 그림자 생성 허용.
  bodyMesh.add(domeMesh); // 돔 메쉬를 bodyMesh의 자식노드로 추가
  domeMesh.position.y = 0.5; // bodyMesh를 기준으로 y축 방향으로 약간 올려줌.

  // 회전하면서 움직이는 포탑을 만들어서 bodyMesh의 자식노드로 추가함.
  const turretWidth = 0.1;
  const turretHeight = 0.1;
  const turretLength = carLength * 0.75 * 0.2;
  const turretGeometry = new THREE.BoxGeometry(
    turretWidth, turretHeight, turretLength
  );
  const turretMesh = new THREE.Mesh(turretGeometry, bodyMaterial);
  const turretPivot = new THREE.Object3D(); // turretMesh의 부모노드를 만들어 줌. (근데 1번 예제랑은 달리 다른 요소와 같이 담기는 것도 아닌데 왜 부모노드를 따로 만들었는지 모르겠음.)
  turretMesh.castShadow = true;
  turretPivot.scale.set(5, 5, 5);
  turretPivot.position.y = 0.5; // bodyMesh를 기준으로 y축 방향으로 조금 올림
  turretMesh.position.z = turretLength * 0.5; // turretPivot을 기준으로 z축 방향으로 앞으로 당김.
  turretPivot.add(turretMesh); // turretPivot의 자식노드로 추가함.
  bodyMesh.add(turretPivot); // turretPivot을 bodyMesh의 자식노드로 추가함.

  // turretMesh에 자식노드로 할당해서 turretMesh를 따라다니는 카메라를 만듦.
  const turretCamera = makeCamera();
  turretCamera.position.y = 0.75 * 0.2;
  turretMesh.add(turretCamera);

  // turret이 겨냥하면서 움직일 targetMesh를 만듦.
  const targetGeometry = new THREE.SphereGeometry(0.5, 6, 3);
  const targetMaterial = new THREE.MeshPhongMaterial({
    color: 0x00FF00,
    flatShading: true
  });
  // flat shading 처리를 할 것인지 여부 결정. 가장 기본적인 쉐이딩으로 생성된 면에 광원을 계산해서 명암을 줌. 명암에 의해 면과 면 사이에 뚜렷한 각이 져 보임.
  const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
  const targetOrbit = new THREE.Object3D(); // targetMesh의 이동 경로를 계산하는 역할
  const targetElevation = new THREE.Object3D(); // targetOrbit의 상대 좌표를 넘겨주는 역할
  const targetBob = new THREE.Object3D(); // 위아래로 보빙(왔다갔다 하는거)하는 역할
  targetMesh.castShadow = true; // 이 메쉬에 의한 그림자 생성 허용.
  scene.add(targetOrbit); // target은 탱크와는 별개로 움직이는 애니까 타겟과 관련된 가장 상위 노드인 targetOrbit은 곧바로 scene에 추가한 것.
  targetOrbit.add(targetElevation);
  targetElevation.position.z = carLength * 2;
  targetElevation.position.y = 8; // targetOrbit을 기준으로 위치값을 조정함.
  targetElevation.add(targetBob);
  targetBob.add(targetMesh);

  // targetBob에 자식노드로 추가하여 targetBob의 움직임을 따라다니는 카메라를 만듦.
  const targetCamera = makeCamera();
  const targetCameraPivot = new THREE.Object3D(); // 얘는 targetBob에 자식노드로 추가됨으로써 targetMesh의 지역공간과는 별개로 작용함.
  targetCamera.position.y = 1;
  targetCamera.position.z = -2; // 부모노드인 targetCameraPivot을 기준으로 위치값이 조정되겠지
  targetCamera.rotation.y = Math.PI; // 카메라를 180도 회전시켜서 정반대 방향, 즉 탱크를 바라보도록 한 것.
  targetBob.add(targetCameraPivot);
  targetCameraPivot.add(targetCamera);

  // SplineCurve 클래스를 이용하여 탱크의 움직임을 계산하는 곡선 경로를 만듦.
  // SplineCurve는 2차원 평면상의 Vector2로 만든 point들의 배열을 전달받아서 curve를 정의함.
  const curve = new THREE.SplineCurve([
    new THREE.Vector2(-10, 0),
    new THREE.Vector2(-5, 5),
    new THREE.Vector2(0, 0),
    new THREE.Vector2(5, -5),
    new THREE.Vector2(10, 0),
    new THREE.Vector2(5, 10),
    new THREE.Vector2(-5, 10),
    new THREE.Vector2(-10, -10),
    new THREE.Vector2(-15, -8),
    new THREE.Vector2(-10, 0),
  ]);

  const points = curve.getPoints(50); // getPoints는 Curve 클래스로부터 상속받은 메소드로, getPoints(divisions)하면 해당 curve를 division 숫자만큼 조각내서 각 curve를 나누는 지점들(division + 1)개의 좌표값들을 리턴해 줌. 
  const geometry = new THREE.BufferGeometry().setFromPoints(points); // setFromPoints는 어떤 points 좌표값들이 담긴 배열을 전달받아서 그 좌표값들을 이용하여 사용자 지정 buffer geometry를 만듦.
  const material = new THREE.LineBasicMaterial({
    color: 0xff0000
  });
  const splineObject = new THREE.Line(geometry, material); // 탱크의 이동 경로를 나타내는 빨간 곡선 메쉬를 만듦. lineSegments와 거의 유사한 클래스라고 함.
  splineObject.rotation.x = Math.PI * 0.5; // groundMesh에 그려질 곡선이고, groundMesh는 -90도만큼 회전시켰지만 여기는 90도만큼 회전시킴. 어쨋든 둘다 같은 수평면에 렌더되는 것은 동일할거임.
  splineObject.position.y = 0.05; // groundMesh보다 약간 위로 띄워 줌.
  scene.add(splineObject);

  // resize
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // 타겟의 현재 위치 좌표값, 탱크의 현재 위치 좌표값, 탱크가 향해야 할 지점의 좌표값을 담아놓을 Vector 인스턴스들을 만들어놓음.
  const targetPosition = new THREE.Vector3(); // target은 x, y, z 모든 방향으로 움직이니까 3D 공간상의 point 좌표값이 필요함.
  const tankPosition = new THREE.Vector2(); // tank는 groundMesh 상에서 x, z방향으로만 움직이니까 2D 평면상의 좌표값만 있으면 됨.
  const tankTarget = new THREE.Vector2();

  // 지금까지 만들어놓은 카메라들과 각 카메라에 대한 설명을 info 태그에 할당하기 위해 배열로 담아놓음.
  const cameras = [{
      cam: camera,
      desc: 'detached camera'
    },
    {
      cam: turretCamera,
      desc: 'on turret looking at target'
    },
    {
      cam: targetCamera,
      desc: 'near target looking at tank'
    },
    {
      cam: tankCamera,
      desc: 'above back of tank'
    },
  ];

  // 현재 어떤 카메라 지점에서 보고 있는지 알려주는 div 태그를 가져옴.
  const infoElem = document.querySelector('#info');

  function animate(t) {
    t *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      cameras.forEach((cameraInfo) => {
        const camera = cameraInfo.cam;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      });
    }

    // target에 대한 움직임 정의
    targetOrbit.rotation.y = t * 0.27; // 타겟에 관한 가장 상위 부모노드인 targetOrbit은 root node인 scene을 기준으로 y축 방향으로 계속 회전함.
    targetBob.position.y = Math.sin(t * 2) * 4; // targetBob의 y좌표값은 수직 왕복운동을 해야하므로 Math.sin에서 리턴받는 값으로 정의하면 좋겠지
    targetMesh.rotation.x = t * 7;
    targetMesh.rotation.y = t * 13; // targetMesh는 x, y 방향으로 계속 회전하지만, targetCamera는 targetMesh의 지역공간 내에 있지 않으므로 targetMesh를 따라 회전하지는 않겠지
    targetMaterial.emissive.setHSL(t * 10 % 1, 1, 0.25);
    targetMaterial.color.setHSL(t * 10 % 1, 1, 0.25); // targetMesh에 적용될 targetMaterial의 emissive와 color의 색상값 중 hue값만 매 프레임마다 변화하는 t값에 의해서 바뀌겠지

    // tank에 대한 움직임 정의
    const tankTime = t * 0.05;
    // curve.getPointAt(t, optionalTarget)에서 t는 curve의 시작점과 끝점을 0과 1로 놓고 봤을 때, 그 사이의 비율값을 넣어서 curve상에서 그 비율값에 해당하는 지점의 좌표값을 리턴해 줌.
    // optionalTarget을 만약 따로 전달하면 리턴받은 좌표값을 해당 벡터에 복사해 줌.
    curve.getPointAt(tankTime % 1, tankPosition);
    curve.getPointAt((tankTime + 0.01) % 1, tankTarget);
    // 이렇게 함으로써, 매 프레임마다 변화하는 tankTime에 따라 tank의 곡선상 현재 좌표값(tankPosition)을 할당해주고,
    // tankTime + 0.01 즉, 곡선상의 비율에서 현재 지점보다 조금 더 앞서있는 지점의 좌표값을 탱크가 바라볼 지점의 좌표값(tankTarget)에 할당해 줌.
    tank.position.set(tankPosition.x, 0, tankPosition.y);
    tank.lookAt(tankTarget.x, 0, tankTarget.y);
    // tankPosition, tankTarget은 어차피 Vector2이기 때문에 (x, y)값만 존재하는데, 지금 groundMesh를 -90도로 회전시킨 상황이기 때문에,
    // groundMesh상에서의 2D 평면 좌표는 x, z축의 좌표값으로만 할당이 가능함. 그래서 중간에 y좌표값은 0으로 고정시킨 뒤, x, z좌표값만 가지고 groundMesh상에서의 tank의 위치값을 할당한 것.
    // 그리고 Object3D 객체(즉, tank)도 camera 객체처럼 lookAt 메소드를 가지고 있어서 해당 객체가 어느 좌표값 지점을 향해 바라보게 할 지 각도를 조절해줄 수 있음.

    // turret이 target을 향하도록 함
    // Object3D(또는 Mesh).getWorldPosition(Vector3)는 해당 Object3D(또는 Mesh)의 전역 공간 상에서의 3D 위치 좌표값을 전달받은 Vector3 객체에 복사하여 할당해 줌.
    // 참고로 지역 공간은 해당 Object3D 또는 Mesh의 부모 노드의 원점을 기준으로 하는 공간좌표, 전역 공간은 말 그대로 scene 자체의 원점을 기준으로 하는 공간좌표임.
    // 부모노드 기준의 상대적인 좌표값이냐, scene 기준의 절대적인 좌표값이냐의 차이로도 볼 수 있음. 
    targetMesh.getWorldPosition(targetPosition); // 한마디로 현재 targetMesh의 부모노드가 아닌, scene 전체를 기준으로 한 3D위치 좌표값을 구한 것. 왜 이걸 구한걸까?
    turretPivot.lookAt(targetPosition); // 왜냐하며 turretPivot이 써야 하니까! turret은 tank의 하위 노드이고, targetMesh는 tank와는 별개의 노드인데, targetMesh의 부모노드를 기준으로 한 상대적인 좌표값을 쓸 수는 없잖아!

    // turret의 자식노드인 turretCamera도 같은 지점을 향할 수 있도록 각도를 조절해 줌
    turretCamera.lookAt(targetPosition);

    // 반대로 탱크의 전역공간 상에서의 절대 좌표값을 리턴받은 뒤 targetBob의 자식노드인 targetCameraPivot도 탱크의 전역공간 좌표값을 향하여 각도를 조절함으로써 자식노드인 targetCamera도 그 영향을 받아 각도가 조절되어 tank를 바라보도록 함.
    tank.getWorldPosition(targetPosition);
    targetCameraPivot.lookAt(targetPosition);

    // 6개의 wheel들을 모두 x축 방향으로 동일한 속도로 회전시킴 
    wheelMeshes.forEach((obj) => {
      obj.rotation.x = t * 3;
    });

    // t * 0.25 % cameras.length | 0 이 값은 t값이 뭐냐에 따라 0 ~ 3 사이의 값이 나오도록 한거지. 왜? cameras.length = 4니까.
    // 그니까 t값이 일정 값에 도달하면 4로 나눈 나머지가 0 또는 1 또는 2 또는 3이 되도록 해서 일정 시간이 지날 때마다 renderer.reder()에 넣어주는 카메라가 순차적으로 바뀌고,
    // infoElem에 넣어주는 설명 텍스트도 그에 따라 바꿔주는거임.
    const camera = cameras[t * 0.25 % cameras.length | 0];
    infoElem.textContent = camera.desc;

    renderer.render(scene, camera.cam);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

main();