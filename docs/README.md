# Tithonion開発用README
基本はレイヤードアーキテクチャとSOLID原則に基づいて設計する。  
ただし、これによって複雑になる場合はその限りではない。

管理を複雑にしないために、単方向の原則を極力守る。
- Commands→Services→(Repository or Domain)

抽象化はやりすぎないようにする。