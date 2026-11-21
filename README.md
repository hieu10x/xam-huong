# Xăm Hường

Trò đổ xăm hường dân gian xứ Huế, chơi trên trình duyệt. Mọi người dùng chung một màn hình (TV, iPad), lần lượt chạm vào tô để đổ hột.

Game không cần cài đặt hay build, cũng không cần máy chủ riêng. Chỉ có HTML, CSS và JavaScript thuần.

## Chạy

- **Trên máy tính:** mở trực tiếp `index.html` bằng trình duyệt.
- **Trên iPad / TV trong cùng mạng Wi-Fi:** chạy một web server tĩnh trên máy tính:

  ```bash
  python3 -m http.server 8080
  ```

  Sau đó mở `http://<địa-chỉ-IP-máy-tính>:8080` trên iPad hoặc trình duyệt của TV. Trên iPad, chọn *Chia sẻ → Thêm vào MH chính* để mở game toàn màn hình như một ứng dụng.
- Muốn chơi ở bất cứ đâu thì đưa cả thư mục lên một dịch vụ host tĩnh (GitHub Pages, Netlify, Cloudflare Pages…).

Nếu không có mạng, game vẫn chạy được, chỉ là phông chữ sẽ chuyển sang phông có sẵn trên máy.

## Tính năng

- Chơi từ 6 đến 12 cửa. Ít người thì một người chơi nhiều cửa. Mỗi cửa có tên và một biểu tượng: nón lá, hoa sen, cá chép, lồng đèn, trống đồng, quạt, hoa mai, bánh chưng, dưa hấu, cây tre.
- Tô sứ men lam, 6 hột có mặt nhất và mặt tứ màu đỏ, kèm tiếng hột lăn trong tô. Âm thanh được tổng hợp bằng Web Audio nên không cần tệp âm thanh.
- 63 thẻ ngà vẽ theo bộ thẻ của vua Tự Đức. Mỗi loại thẻ có kích thước và màu chữ Hán riêng: 狀元, 榜眼, 探花, 會元, 進士, 舉人, 秀才.
- Tự nhận diện tổ hợp hột và tự tính tuổi trạng, giật trạng, gom 32 điểm, ngũ hường, lục phú.
- Cuối ván tự thanh toán: mỗi cửa dư hay thiếu bao nhiêu so với 32 điểm, quy ra tiền theo giá mỗi điểm, và ai trả ai.
- **Đổ tự động**: máy đổ lần lượt cho từng cửa đến hết thẻ, có thể dừng giữa chừng hoặc nhảy thẳng tới kết quả.
- Có nút **Nhập hột thật** để chơi bằng tô và hột thật, game chỉ lo phần tính thẻ.
- Có nút **Hoàn tác** khi ai đó đổ nhầm lượt. Ván đang chơi được lưu tự động, lỡ tải lại trang vẫn chơi tiếp được.
- Giữ màn hình luôn sáng khi trình duyệt hỗ trợ Wake Lock, có chế độ toàn màn hình, và tự xếp lại giao diện khi xoay ngang hay dọc.

## Luật chơi

Luật dựa theo bài [Về Huế đổ xăm hường](https://anhsontranduc.wordpress.com/2016/01/18/ve-hue-do-xam-huong-va-ngam-hai-bo-xam-huong-cua-hue-xua/) của Trần Đức Anh Sơn, cộng thêm lệ chơi trong nhà. Xem đầy đủ trong mục **Luật** ngay trong game.

**Giật trạng.** Trạng có tuổi và chia hai hệ. Hai hệ không giật qua lại của nhau.

- *Trạng hường* (bốn mặt tứ): tuổi là tổng hai mặt còn lại. Trạng cáp (tổng bằng 4) lớn nhất, trong đó cáp chính (2+2) lớn hơn cáp xiên (1+3).
- *Trạng đen* (ngũ tử, năm mặt giống nhau khác mặt tứ): tuổi là mặt còn lại.
- *Ngũ hường* (năm mặt tứ) giật cả trạng anh lẫn hai trạng em, và cũng tính tuổi.

Đổ ra trạng lớn tuổi hơn cùng hệ thì giật trạng. Không giật được thì gom 32 điểm thẻ trên bàn, từ thẻ cao xuống thấp. Người đang giữ trạng mà đổ ra trạng lớn tuổi hơn thì coi như tự giật trạng của mình: không được thêm thẻ, chỉ có trạng lên tuổi nên khó bị giật hơn.

**Lục phú.** Lục phú hường (sáu mặt tứ): mỗi cửa chung 64 điểm. Lục phú đen (sáu mặt giống nhau khác): mỗi cửa chung 32 điểm. Cả hai đều kết thúc ván ngay.

**Thanh toán.** Mỗi cửa phải đủ 32 điểm: dư thì bán, thiếu thì mua, theo giá mỗi điểm đặt trước khi chơi. Bộ thẻ có 192 điểm, chỉ đủ cho 6 cửa. Mỗi cửa thêm thì bán trạng thêm một bậc, và mỗi bậc cộng đúng 32 điểm:

| Số cửa | Bán trạng | Tổng điểm |
|---|---|---|
| 6 | Không bán | 192 |
| 7 | Trạng ×2 | 224 |
| 8 | Thêm bán trạng em: Bảng nhãn, Thám hoa ×2 | 256 |
| 9 | Trạng ×3 | 288 |
| 10 | Bảng nhãn, Thám hoa ×3 | 320 |
| 11 | Bán tam hường: Hội nguyên ×2 | 352 |
| 12 | Hội nguyên ×3 | 384 |

**Hết thẻ.** Ra tổ hợp mà loại thẻ đó đã hết thì không được gì. Nếu bật *Quy đổi khi hết thẻ* thì lấy các thẻ nhỏ hơn có tổng điểm tương đương. Ván kết thúc khi hộp hết thẻ hoặc sau số vòng đã chọn. Muốn xong nhanh thì vào mục **Ván** chọn *Đổ tự động đến hết ván* (bấm Dừng lúc nào cũng được), hoặc *Đổ nhanh, xem kết quả ngay*.

## Cấu trúc

```
index.html        giao diện
css/style.css     phong cách sơn son thếp vàng, sứ men lam, ngà voi
js/rules.js       luật chơi (logic thuần, chạy được cả trên Node)
js/art.js         hình vẽ SVG: thẻ, hột, tô, lồng đèn, hoa mai, Ngọ Môn, biểu tượng
js/audio.js       âm thanh Web Audio
js/app.js         điều khiển ván chơi
tests/            kiểm thử luật chơi: node --test tests/rules.test.js
```
