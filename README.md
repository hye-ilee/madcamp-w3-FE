# Globance 🗺️

## 개요 📝
Global news at a Glance, **Globance**는 글로벌 이슈들을 한눈에 볼 수 있도록 한 웹 서비스 입니다.
지구본 또는 세계 지도 위에 일곱 카테고리의 글로벌 이슈들이 중요도에 따라 크고 작은 원으로 나타납니다.
---

## 서비스 구성 🔍

### 1. **랜딩 페이지**
- Globance 이름과 그 뜻이 보이고, 아래 레이어에 천천히 돌아가고 있는 우리 행성 지구가 보입니다.
- 한번 클릭하면 회전이 서서히 멈춥니다.
<p align="center">
  <img src="https://github.com/user-attachments/assets/fcb07558-a055-485c-9078-a1b20bdefc5c" width="300">
</p>

### 2. **프로젝션과 지도 스타일**
- 디폴트로 globe 프로젝션과 satellite 스타일이 설정되어있고,
  - 프로젝션은 globe와 평면 지도인 mercator, 스타일은 Mapbox에서 지원하는 여러 스타일 중 satellite, dark, navigation-night가 드롭다운에서 선택 가능합니다.

### 3. **7개의 카테고리**
- 백엔드에서 News API를 이용해 매일 새로운 글로벌 이슈들을 크롤링하고 NLP 모델을 이용해 요약 및 위치 정보 추출을 수행해 DB에 저장하며,
이를 7개의 카테고리(general, business, health, science, technology, sports, entertainment)마다 각각 다른 색의 마커로 지도 상에 표현합니다.
  - 반투명한 색으로 설정해 여러 이슈들의 위치가 중복되면 색이 더 진하게 나타납니다.
  - 마커를 클릭하면 팝업을 통해 해당 위치의 모든 이슈 헤드라인과 기사 링크를 볼 수 있습니다.
<p align="center">
  <img src="https://github.com/user-attachments/assets/784f7f50-9487-48ad-9d68-afb1c39a84dc" width="300">
</p>

### 4. **뉴스 스탠드**
- 현재 활성화된 카테고리들의 이슈들은 마커 외에도 상단 우측의 메뉴 버튼을 클릭해 list로 나열된 형태로 볼 수 있습니다.
    - preview image가 있는 기사는 list 안에 이미지도 보이고, Read more를 누르면 기사 링크로 연결됩니다.
    - 이들 또한 각 list item을 클릭하면 해당 마커로 지도가 이동하고, 팝업이 자동으로 열립니다.

---

## 레퍼런스 📚
- **지도:** Mapbox-gl-js
- **뉴스 데이터:** News API
---

## 팀원 👥

| 이름   | 소속             | 이메일                  | Github ID                               | 
|------|----------------|----------------------|-----------------------------------------|
| 이혜리  | KAIST 전산학부  | harriet@kaist.ac.kr  | [hye-ilee](https://github.com/hye-ilee) | 
| 박세준  | KAIST 전산학부  | sejun0601@kaist.ac.kr | [sejun0601](https://github.com/sejun0601) | 

<br>