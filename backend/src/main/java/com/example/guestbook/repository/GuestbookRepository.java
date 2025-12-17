package com.example.guestbook.repository;

import com.example.guestbook.domain.Guestbook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuestbookRepository extends JpaRepository<Guestbook, Long> {
    List<Guestbook> findAllByOrderByCreatedAtDesc();
}