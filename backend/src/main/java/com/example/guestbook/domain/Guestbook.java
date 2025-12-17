package com.example.guestbook.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Guestbook {
    @Id
    @GeneratedValue
    private Long id;

    @Column(nullable = false)
    private String content; //다짐 내용

    @Column(nullable = false)
    private String author; // 작성자 이름

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
