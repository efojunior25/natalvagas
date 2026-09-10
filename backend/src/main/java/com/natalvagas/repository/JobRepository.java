package com.natalvagas.repository;

import com.natalvagas.domain.Job;
import com.natalvagas.domain.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    Optional<Job> findBySlugAndStatus(String slug, JobStatus status);

    Optional<Job> findBySlug(String slug);

    List<Job> findTop1000ByStatusOrderByPublishedAtDesc(JobStatus status);
}
